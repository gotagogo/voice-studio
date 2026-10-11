// Binary references are encoded as MessagePack, as required by Fish Audio.
function pack(value: any): Uint8Array<ArrayBuffer> {
 const parts: Uint8Array[]=[]; const put=(...n:number[])=>parts.push(Uint8Array.from(n));
 const length=(tag:number,n:number)=>{put(tag,n>>>24,n>>>16,n>>>8,n)};
 const encode=(v:any)=>{if(typeof v==='string'){const b=new TextEncoder().encode(v);length(0xdb,b.length);parts.push(b)}else if(v instanceof Uint8Array){length(0xc6,v.length);parts.push(v)}else if(typeof v==='number'){const b=new Uint8Array(9);b[0]=0xcb;new DataView(b.buffer).setFloat64(1,v);parts.push(b)}else if(typeof v==='boolean'){put(v?0xc3:0xc2)}else if(Array.isArray(v)){length(0xdd,v.length);v.forEach(encode)}else{const e=Object.entries(v);length(0xdf,e.length);e.forEach(([k,x])=>{encode(k);encode(x)})}};
 encode(value);const out=new Uint8Array(parts.reduce((s,b)=>s+b.length,0));let offset=0;for(const b of parts){out.set(b,offset);offset+=b.length}return out;
}
async function generate(request:Request){
 const fail=(message:string,status=400)=>Response.json({error:message},{status,headers:{'Cache-Control':'no-store'}});

 if(Number(request.headers.get('content-length'))>12*1024*1024)return fail('檔案過大，請使用 10 MB 以下樣本。',413);
 try{
 const data=await request.formData();const key=String(data.get('key')||'').trim();const file=data.get('audio');const text=String(data.get('text')||'').trim();const transcript=String(data.get('transcript')||'').trim();
 if(!key || key.length>512 || /[\r\n]/.test(key))return fail('請填入有效的 Fish Audio API Key。');
 if(!(file instanceof File)||!file.size||file.size>10*1024*1024)return fail('請上傳 10 MB 以下的聲音樣本。');
 if(!/\.(wav|mp3|m4a|flac|ogg|webm)$/i.test(file.name))return fail('不支援此音訊格式。');
 if(!text||text.length>5000||!transcript||transcript.length>5000)return fail('請填寫文字及樣本逐字稿（各最多 5,000 字）。');
 const number=(name:string,min:number,max:number)=>{const n=Number(data.get(name));if(!Number.isFinite(n)||n<min||n>max)throw Error('參數超出範圍');return n};
 const model=String(data.get('model'));if(!['s2.1-pro','s2.1-pro-free','s2-pro'].includes(model))return fail('不支援此模型。');
 const format=String(data.get('format'));if(!['mp3','wav'].includes(format))return fail('不支援此輸出格式。');
 const emotion=String(data.get('emotion')||'');if(!['','calm','happy','excited','confident','sad','soft tone','whispering'].includes(emotion))return fail('不支援此語氣。');
 const payload={text:(emotion?'['+emotion+'] ':'')+text,references:[{audio:new Uint8Array(await file.arrayBuffer()),text:transcript}],format,prosody:{speed:number('speed',.5,2),volume:number('volume',-20,20)},temperature:number('temperature',0,1),top_p:number('top_p',0.1,1),normalize:true,latency:'normal',mp3_bitrate:192};
 const upstream=await fetch('https://api.fish.audio/v1/tts',{method:'POST',headers:{Authorization:'Bearer '+key,'Content-Type':'application/msgpack',model},body:pack(payload),signal:AbortSignal.timeout(180000)});
 if(!upstream.ok){const messages:Record<number,string>={401:'API Key 無效，請確認後重試。',402:'Fish Audio 帳戶額度不足或無此模型權限。',429:'請求過於頻繁，請稍後再試。',422:'Fish 無法處理此樣本或參數，請換成清晰的 WAV / MP3 樣本。',503:'Fish Audio 暫時忙碌，請稍後再試。'};return fail(messages[upstream.status]||'Fish Audio 生成失敗（'+upstream.status+'），請確認音檔及帳戶設定。',upstream.status)}
 return new Response(upstream.body,{headers:{'Content-Type':format==='wav'?'audio/wav':'audio/mpeg','Cache-Control':'no-store','Content-Disposition':'attachment; filename="voice.'+format+'"'}});
 }catch(e){return fail(e instanceof Error&&e.name==='TimeoutError'?'生成逾時，請縮短文字後重試。':'無法處理請求，請檢查音檔與參數後重試。',502)}
}

export default { async fetch(request:Request, env:{ALLOWED_ORIGIN:string}) {
 const origin=request.headers.get('Origin');
 const allowed=env.ALLOWED_ORIGIN;
 if(!allowed || origin!==allowed) return new Response('Forbidden',{status:403});
 const headers={'Access-Control-Allow-Origin':allowed,'Access-Control-Allow-Methods':'POST, OPTIONS','Access-Control-Allow-Headers':'Content-Type','Vary':'Origin','Cache-Control':'no-store'};
 if(request.method==='OPTIONS')return new Response(null,{status:204,headers});
 if(request.method!=='POST')return new Response('Method not allowed',{status:405,headers});
 if(new URL(request.url).pathname!=='/api/generate')return new Response('Not found',{status:404,headers});
 const response=await generate(request);const out=new Response(response.body,response);for(const [k,v]of Object.entries(headers))out.headers.set(k,v);return out;
}};
