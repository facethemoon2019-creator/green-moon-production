/// <reference types="@cloudflare/workers-types" />

export interface Env {
  DB: D1Database;
  ASSETS: Fetcher;
  OPENAI_API_KEY?: string;
  ADMIN_TOKEN?: string;
}

const PRIVATE_FIELDS = ["wholesale_price","cost_price"];

function json(data: unknown, status=200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type":"application/json; charset=utf-8",
      "cache-control":"no-store"
    }
  });
}

function slugify(v:string) {
  return v.toLowerCase().trim().replace(/[^\p{L}\p{N}]+/gu,"-").replace(/^-|-$/g,"");
}

function adminOK(request:Request, env:Env) {
  const supplied=request.headers.get("x-admin-token");
  return !!env.ADMIN_TOKEN && !!supplied && supplied===env.ADMIN_TOKEN;
}

function publicProduct(p:any) {
  return {
    id:p.id, category_id:p.category_id, name:p.name, slug:p.slug,
    description:p.description, image_url:p.image_url, price:p.price,
    old_price:p.old_price, stock:p.stock, max_qty:p.max_qty,
    care_json:p.care_json
  };
}

async function openAI(env:Env, prompt:string, imageData?:string) {
  if(!env.OPENAI_API_KEY) return null;
  const content:any[]=[{type:"input_text",text:prompt}];
  if(imageData) content.push({type:"input_image",image_url:imageData});
  const r=await fetch("https://api.openai.com/v1/responses",{
    method:"POST",
    headers:{
      "authorization":`Bearer ${env.OPENAI_API_KEY}`,
      "content-type":"application/json"
    },
    body:JSON.stringify({
      model:"gpt-5.6-luna",
      input:[{role:"user",content}],
      max_output_tokens:1800
    })
  });
  if(!r.ok) throw new Error("AI request failed");
  const data:any=await r.json();
  return data.output_text || "";
}

export default {
 async fetch(request:Request, env:Env):Promise<Response> {
  const u=new URL(request.url), p=u.pathname, method=request.method;

  if(p==="/admin" || p==="/admin/") return env.ASSETS.fetch(new Request(new URL("/index.html",request.url),request));

  if(p==="/api/health") return json({ok:true,service:"green-moon"});

  if(p==="/api/store" && method==="GET"){
    await env.DB.batch([
      env.DB.prepare("INSERT OR IGNORE INTO categories(name,slug,icon,sort_order) VALUES(?,?,?,?)").bind("نباتات الزينة","plants","🪴",10),
      env.DB.prepare("INSERT OR IGNORE INTO categories(name,slug,icon,sort_order) VALUES(?,?,?,?)").bind("العروض","offers","🔥",20),
      env.DB.prepare("INSERT OR IGNORE INTO categories(name,slug,icon,sort_order) VALUES(?,?,?,?)").bind("الفازات والإكسسوارات","vases","🏺",30)
    ]);
    const settings=await env.DB.prepare("SELECT data FROM settings WHERE id=1").first<any>();
    const cats=await env.DB.prepare("SELECT id,name,slug,icon,image_url,sort_order FROM categories WHERE active=1 ORDER BY sort_order,id").all();
    const ps=await env.DB.prepare("SELECT id,category_id,name,slug,description,image_url,price,old_price,stock,max_qty,care_json FROM products WHERE active=1 ORDER BY id DESC").all();
    const offers=await env.DB.prepare("SELECT id,title,description,image_url,price,old_price,stock,show_seconds,gap_seconds,sort_order FROM flash_offers WHERE active=1 ORDER BY sort_order,id").all();
    const reviews=await env.DB.prepare("SELECT id,customer_name,stars,text,verified,created_at FROM reviews WHERE active=1 ORDER BY id DESC LIMIT 50").all();
    const response = json({
      settings:settings?JSON.parse(settings.data):{},
      categories:cats.results,
      products:ps.results,
      offers:offers.results,
      reviews:reviews.results
    });
    response.headers.set("cache-control","public, max-age=5, stale-while-revalidate=30");
    return response;
  }

  if(p==="/api/orders" && method==="POST"){
    const b:any=await request.json();
    if(!b.customer?.name || !b.customer?.phone || !Array.isArray(b.items) || !b.items.length)
      return json({error:"بيانات الطلب غير مكتملة"},400);

    const ids=b.items.map((x:any)=>Number(x.productId)).filter(Boolean);
    const q=ids.map(()=>"?").join(",");
    const rows=await env.DB.prepare(`SELECT id,name,price,stock,max_qty FROM products WHERE active=1 AND id IN (${q})`).bind(...ids).all<any>();
    const byId = new Map<number, any>(rows.results.map((x:any)=>[Number(x.id),x]));

    let subtotal=0;
    const safe:any[]=[];
    for(const item of b.items){
      const pr=byId.get(Number(item.productId));
      if(!pr) return json({error:"منتج غير متاح"},409);
      const qty=Math.max(1,Math.min(Number(item.qty)||1,Number(pr.max_qty)||99));
      if(Number(pr.stock)<qty) return json({error:`المخزون غير كافٍ: ${pr.name}`},409);
      subtotal+=Number(pr.price)*qty;
      safe.push({pr,qty});
    }

    const delivery=subtotal>=700?0:50;
    const discount=Math.max(0,Number(b.discount)||0);
    const adjustment=Number(b.adjustment)||0;
    const total=Math.max(0,subtotal+delivery-discount+adjustment);
    const number="GM-"+Date.now().toString(36).toUpperCase();

    await env.DB.prepare(`
      INSERT INTO orders(order_number,customer_name,phone,whatsapp,governorate,area,building,floor,apartment,notes,subtotal,delivery,discount,total)
      VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?)
    `).bind(number,b.customer.name,b.customer.phone,b.customer.whatsapp||"",
      b.customer.governorate||"",b.customer.area||"",b.customer.building||"",
      b.customer.floor||"",b.customer.apartment||"",b.customer.notes||"",
      subtotal,delivery,discount,total).run();

    const order=await env.DB.prepare("SELECT id FROM orders WHERE order_number=?").bind(number).first<any>();
    for(const x of safe){
      await env.DB.prepare("INSERT INTO order_items(order_id,product_id,name,qty,unit_price) VALUES(?,?,?,?,?)")
        .bind(order.id,x.pr.id,x.pr.name,x.qty,x.pr.price).run();
      await env.DB.prepare("UPDATE products SET stock=stock-?,updated_at=CURRENT_TIMESTAMP WHERE id=?")
        .bind(x.qty,x.pr.id).run();
    }
    return json({ok:true,orderNumber:number,total});
  }

  if(p==="/api/ai/care" && method==="POST"){
    const b:any=await request.json();
    const name=String(b.name||"").trim();
    if(!name) return json({error:"اسم النبات مطلوب"},400);
    const prompt=`اكتب خطة عناية عملية ومختصرة للنبات: ${name}. تشمل الإضاءة، الري، التربة، التسميد، الرطوبة، وأشهر 2 أخطاء يجب تجنبها. اكتب بالعربية المصرية بشكل واضح ومنظم. لا تذكر أنك نموذج ذكاء اصطناعي. المنتج المتاح إن وجد: ${JSON.stringify(b.product||{})}`;
    try{
      const answer=await openAI(env,prompt);
      if(answer) return json({ok:true,result:answer,source:"openai"});
    }catch(e){ console.error("AI care error",e); }
    return json({ok:true,result:"🤖 الخطة الذكية المحلية\n\n"+name+"\n\n🌿 الإضاءة: ضوء مناسب للنبات ويفضل غير مباشر ما لم يكن من نباتات الشمس المباشرة.\n💧 الري: اسقِ عند جفاف سطح التربة وتجنب ترك الماء راكدًا.\n🌱 التربة: استخدم خليطًا جيد الصرف.\n🧪 التسميد: سماد متوازن بجرعات خفيفة خلال موسم النمو.\n💦 الرطوبة: حافظ على رطوبة مناسبة مع تهوية جيدة.\n⚠️ تجنب: الإفراط في الري، الشمس المباشرة القوية، وتغيير مكان النبات باستمرار.",source:"local"});
  }

  if(p==="/api/ai/space" && method==="POST"){
    const b:any=await request.json();
    if(!b.image) return json({error:"الصورة مطلوبة"},400);
    const products=await env.DB.prepare("SELECT id,name,description,price,image_url,care_json FROM products WHERE active=1").all<any>();
    const prompt=`حلل صورة المكان بدقة واقترح من هذه المنتجات أفضل 3 نباتات. لا تطلب من العميل تحديد نوع المكان أو الإضاءة. استنتج من الصورة: الإضاءة، المساحة، الألوان، الأثاث، الأرضية، المنظور، المكان المتاح، والارتفاع/العرض التقريبي. أعد JSON فقط بالشكل:
{"analysis":{"light":"","space":"","estimated_width_cm":0,"estimated_height_cm":0},"recommendations":[{"product_id":0,"match":0,"reason":"","estimated_height_cm":0,"estimated_width_cm":0}]}
المنتجات: ${JSON.stringify(products.results.map((x:any)=>({id:x.id,name:x.name,description:x.description,price:x.price})))}`
    const answer=await openAI(env,prompt,b.image);
    if(!answer) return json({error:"AI غير مضبوط بعد. أضف OPENAI_API_KEY كـSecret."},503);
    return json({ok:true,result:answer});
  }

  if(p==="/api/ai/plant-doctor" && method==="POST"){
    const b:any=await request.json();
    if(!b.image) return json({error:"الصورة مطلوبة"},400);
    const answer=await openAI(env,
      "حلل صورة النبات كخبير نباتات. أعطِ المشكلة المحتملة، أسبابها، مستوى الخطورة، خطوات العلاج، الري، الإضاءة، التربة، التسميد، وما يجب تجنبه. لا تدّعِ يقينًا طبيًا/علميًا إذا كانت الصورة غير كافية.",
      b.image);
    if(!answer) return json({error:"AI غير مضبوط بعد."},503);
    return json({ok:true,result:answer});
  }


  if(p==="/api/admin/magazine-music" && method==="PUT"){
    if(!adminOK(request,env)) return json({error:"Unauthorized"},401);
    const b:any=await request.json();
    const current=await env.DB.prepare("SELECT data FROM settings WHERE id=1").first<any>();
    const settings=current?JSON.parse(current.data):{};
    settings.magazineMusic={
      enabled:b.enabled!==false,
      url:String(b.url||""),
      volume:Math.max(0,Math.min(1,Number(b.volume)||0.35)),
      autoplay:b.autoplay!==false,
      loop:b.loop!==false
    };
    await env.DB.prepare(`
      INSERT INTO settings(id,data) VALUES(1,?)
      ON CONFLICT(id) DO UPDATE SET data=excluded.data,updated_at=CURRENT_TIMESTAMP
    `).bind(JSON.stringify(settings)).run();
    return json({ok:true,magazineMusic:settings.magazineMusic});
  }

  if(p==="/api/admin/overview" && method==="GET"){
    if(!adminOK(request,env)) return json({error:"Unauthorized"},401);
    const a=await env.DB.prepare("SELECT COUNT(*) orders,COALESCE(SUM(total),0) sales FROM orders").first<any>();
    const b=await env.DB.prepare("SELECT COUNT(*) low FROM products WHERE active=1 AND stock<=5").first<any>();
    return json({orders:a?.orders||0,sales:a?.sales||0,lowStock:b?.low||0});
  }

  if(p==="/api/admin/settings" && method==="PUT"){
    if(!adminOK(request,env)) return json({error:"Unauthorized"},401);
    const body:any=await request.json();
    const current=await env.DB.prepare("SELECT data FROM settings WHERE id=1").first<any>();
    let existing:any={};
    try{ existing=current?JSON.parse(current.data||"{}"):{}; }catch(_){ existing={}; }
    const merged={...existing,...(body&&typeof body==="object"?body:{})};
    await env.DB.prepare(`
      INSERT INTO settings(id,data) VALUES(1,?)
      ON CONFLICT(id) DO UPDATE SET data=excluded.data,updated_at=CURRENT_TIMESTAMP
    `).bind(JSON.stringify(merged)).run();
    return json({ok:true,settings:merged});
  }


  if(p==="/api/admin/products" && method==="GET"){
    if(!adminOK(request,env)) return json({error:"Unauthorized"},401);
    const ps=await env.DB.prepare("SELECT id,category_id,name,slug,description,image_url,price,old_price,wholesale_price,cost_price,stock,max_qty,care_json,active FROM products ORDER BY id DESC").all();
    return json({ok:true,products:ps.results});
  }

  if(p.startsWith("/api/admin/products/") && (method==="PUT" || method==="DELETE")){
    if(!adminOK(request,env)) return json({error:"Unauthorized"},401);
    const id=Number(p.split("/").pop());
    if(!id) return json({error:"Invalid product id"},400);
    if(method==="DELETE"){
      const r=await env.DB.prepare("UPDATE products SET active=0,updated_at=CURRENT_TIMESTAMP WHERE id=? AND active=1").bind(id).run();
      if(!r.meta?.changes) return json({error:"Product not found"},404);
      return json({ok:true,id});
    }
    const b:any=await request.json();
    const existing=await env.DB.prepare("SELECT id,slug FROM products WHERE id=? AND active=1").bind(id).first<any>();
    if(!existing) return json({error:"Product not found"},404);
    let slug=slugify(b.slug||b.name||existing.slug)||existing.slug;
    const duplicate=await env.DB.prepare("SELECT id FROM products WHERE slug=? AND id<>?").bind(slug,id).first<any>();
    if(duplicate) slug=slug+"-"+id;
    let categoryId=b.categoryId==null?null:Number(b.categoryId)||null;
    if(!categoryId && b.categorySlug){
      const c=await env.DB.prepare("SELECT id FROM categories WHERE slug=? AND active=1").bind(String(b.categorySlug)).first<any>();
      categoryId=c?.id||null;
    }
    await env.DB.prepare(`UPDATE products SET category_id=?,name=?,slug=?,description=?,image_url=?,price=?,old_price=?,wholesale_price=?,cost_price=?,stock=?,max_qty=?,care_json=?,updated_at=CURRENT_TIMESTAMP WHERE id=?`)
      .bind(categoryId,b.name||"",slug,b.description||"",b.imageUrl||"",Number(b.price)||0,Number(b.oldPrice)||0,Number(b.wholesalePrice)||0,Number(b.costPrice)||0,Math.max(0,Number(b.stock)||0),Math.max(1,Number(b.maxQty)||99),JSON.stringify({...((b.care&&typeof b.care==="object")?b.care:{}),_sections:Array.isArray(b.sections)?b.sections:[]}),id).run();
    return json({ok:true,id});
  }

  if(p==="/api/admin/products" && method==="POST"){
    if(!adminOK(request,env)) return json({error:"Unauthorized"},401);
    const b:any=await request.json();
    let categoryId=b.categoryId==null?null:Number(b.categoryId)||null;
    if(!categoryId && b.categorySlug){
      const c=await env.DB.prepare("SELECT id FROM categories WHERE slug=? AND active=1").bind(String(b.categorySlug)).first<any>();
      categoryId=c?.id||null;
    }
    const baseSlug=slugify(b.slug||b.name);
    let slug=baseSlug;
    const duplicate=await env.DB.prepare("SELECT id FROM products WHERE slug=?").bind(slug).first<any>();
    if(duplicate) slug=slug+"-"+Date.now();
    const result=await env.DB.prepare(`
      INSERT INTO products(category_id,name,slug,description,image_url,price,old_price,wholesale_price,cost_price,stock,max_qty,care_json)
      VALUES(?,?,?,?,?,?,?,?,?,?,?,?)
    `).bind(
      categoryId,b.name,slug,b.description||"",b.imageUrl||"",
      Number(b.price)||0,Number(b.oldPrice)||0,Number(b.wholesalePrice)||0,
      Number(b.costPrice)||0,Math.max(0,Number(b.stock)||0),Math.max(1,Number(b.maxQty)||99),
      JSON.stringify({...((b.care&&typeof b.care==="object")?b.care:{}),_sections:Array.isArray(b.sections)?b.sections:[]})
    ).run();
    return json({ok:true,id:result.meta?.last_row_id});
  }

  if(p==="/api/admin/flash-offers" && method==="POST"){
    if(!adminOK(request,env)) return json({error:"Unauthorized"},401);
    const b:any=await request.json();
    await env.DB.prepare(`
      INSERT INTO flash_offers(title,description,image_url,price,old_price,stock,show_seconds,gap_seconds,sort_order)
      VALUES(?,?,?,?,?,?,?,?,?)
    `).bind(b.title,b.description||"",b.imageUrl||"",Number(b.price)||0,Number(b.oldPrice)||0,
      Number(b.stock)||0,Number(b.showSeconds)||15,Number(b.gapSeconds)||60,Number(b.sortOrder)||0).run();
    return json({ok:true});
  }

  if(p==="/api/admin/reviews" && method==="POST"){
    if(!adminOK(request,env)) return json({error:"Unauthorized"},401);
    const b:any=await request.json();
    await env.DB.prepare("INSERT INTO reviews(customer_name,stars,text,verified) VALUES(?,?,?,?)")
      .bind(b.name,Math.min(5,Math.max(1,Number(b.stars)||5)),b.text||"",Number(b.verified)||0).run();
    return json({ok:true});
  }

  if(p.startsWith("/api/")) return json({error:"Not found"},404);
  return env.ASSETS.fetch(request);
 }
};
