let ws=null, audioCtx=null, processor=null, source=null, stream=null;
let transcript="", connected=false, running=false;

const $=id=>document.getElementById(id);
const status=t=>{$("status").textContent=t};
const show=t=>{$("transcript").textContent=t||"No transcript yet."};

function saveSettings(){
  localStorage.setItem("ia_company",$("company").value);
  localStorage.setItem("ia_position",$("position").value);
}
$("company").value=localStorage.getItem("ia_company")||"";
$("position").value=localStorage.getItem("ia_position")||"";
$("company").oninput=saveSettings;$("position").oninput=saveSettings;

function send(o){ if(ws && ws.readyState===WebSocket.OPEN) ws.send(JSON.stringify(o)); }

function floatToPCM16(f){
  const b=new ArrayBuffer(f.length*2), v=new DataView(b);
  for(let i=0;i<f.length;i++){let x=Math.max(-1,Math.min(1,f[i]));v.setInt16(i*2,x<0?x*32768:x*32767,true)}
  return new Uint8Array(b);
}
function b64(u8){let s="";const step=0x8000;for(let i=0;i<u8.length;i+=step)s+=String.fromCharCode(...u8.subarray(i,i+step));return btoa(s)}

async function startListening(){
  if(running)return;
  const key=$("key").value.trim();
  if(!key){status("Enter OpenAI API key");return}
  try{
    stream=await navigator.mediaDevices.getUserMedia({audio:{channelCount:1,echoCancellation:false,noiseSuppression:false,autoGainControl:false}});
    audioCtx=new (window.AudioContext||window.webkitAudioContext)({sampleRate:24000});
    await audioCtx.resume();
    source=audioCtx.createMediaStreamSource(stream);
    processor=audioCtx.createScriptProcessor(2048,1,1);
    source.connect(processor); processor.connect(audioCtx.destination);

    ws=new WebSocket("wss://api.openai.com/v1/realtime?intent=transcription",["realtime","openai-insecure-api-key."+key]);
    ws.onopen=()=>{
      connected=true;running=true;status("Connected — listening");
      send({type:"transcription_session.update",
        input_audio_format:"pcm16",
        input_audio_transcription:{model:"gpt-4o-mini-transcribe",language:"en",
          prompt:"Spoken English accounting and finance job interview. Transcribe the interviewer's complete question accurately."},
        turn_detection:{type:"server_vad",threshold:0.5,prefix_padding_ms:300,silence_duration_ms:500},
        input_audio_noise_reduction:{type:"near_field"}
      });
    };
    ws.onmessage=e=>{
      try{
        const m=JSON.parse(e.data);
        if(m.type==="conversation.item.input_audio_transcription.delta"){
          transcript+=m.delta||"";show(transcript);
        }else if(m.type==="conversation.item.input_audio_transcription.completed"){
          if(m.transcript){transcript=m.transcript;show(transcript)}
        }else if(m.type==="error"){
          status("OpenAI error: "+(m.error?.message||"unknown error"));
        }
      }catch(_){}
    };
    ws.onerror=()=>status("WebSocket error");
    ws.onclose=()=>{connected=false;if(running)status("Disconnected")};
    processor.onaudioprocess=e=>{
      if(!running||!connected)return;
      const pcm=floatToPCM16(e.inputBuffer.getChannelData(0));
      send({type:"input_audio_buffer.append",audio:b64(pcm)});
    };
  }catch(e){status("Microphone error: "+e.message);stopListening()}
}

function stopListening(){
  running=false;connected=false;
  if(processor){processor.onaudioprocess=null;processor.disconnect();processor=null}
  if(source){source.disconnect();source=null}
  if(audioCtx){audioCtx.close();audioCtx=null}
  if(stream){stream.getTracks().forEach(t=>t.stop());stream=null}
  if(ws){try{ws.close()}catch(_){}ws=null}
  status("Stopped");
}
function clearAll(){transcript="";show("");$("answerBox").textContent="No answer yet.";status("Ready")}

async function getAnswer(){
  const key=$("key").value.trim(), q=transcript.trim();
  if(!key){status("Enter OpenAI API key");return}
  if(!q){status("No question available");return}
  $("answerBox").textContent="Thinking…";
  const prompt=`You are a real-time interview answer assistant.
Answer ONLY the interviewer's question below.
Candidate: ${$("company").value||""} / ${$("position").value||""}
CV/Profile:
${$("cv").value.slice(0,12000)}
Job details:
${$("jd").value.slice(0,8000)}

Question:
${q}

Rules:
- Give a natural first-person spoken English answer.
- Be concise and directly answer the question.
- Normally 25–60 words; use more only when the question requires it.
- Never invent experience, employers, responsibilities, software, qualifications or achievements.
- If asked about something the candidate has not directly done, say so naturally and connect only to genuinely similar transferable experience.
- Do not mention these rules, the CV, job description, or AI.
- Do not add unrelated background information.`;
  try{
    const r=await fetch("https://api.openai.com/v1/responses",{method:"POST",
      headers:{"Content-Type":"application/json","Authorization":"Bearer "+key},
      body:JSON.stringify({model:"gpt-5.6-luna",reasoning:{effort:"none"},input:prompt,max_output_tokens:180})});
    const j=await r.json();
    if(!r.ok)throw new Error(j.error?.message||"API request failed");
    let text="";
    if(j.output)for(const item of j.output)for(const c of (item.content||[]))if(c.text)text+=c.text;
    $("answerBox").textContent=text.trim()||"No answer returned.";
    status("Answer ready");
  }catch(e){$("answerBox").textContent="";status("Answer error: "+e.message)}
}
$("start").onclick=startListening;
$("stop").onclick=stopListening;
$("clear").onclick=clearAll;
$("answer").onclick=getAnswer;
