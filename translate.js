const recordBtn = document.querySelector(".translate-btn");
const downloadBtn = document.querySelector(".download-btn");
const player = document.querySelector(".audio-player");
const gearL = document.querySelector("#svg_71");
const gearR = document.querySelector("#svg_113");
if (navigator.mediaDevices.getUserMedia) {
  var chunks = [];
  const constraints = { audio: true };
  navigator.mediaDevices.getUserMedia(constraints).then(
    stream => {
      console.log("授权成功！");

      const mediaRecorder = new MediaRecorder(stream);

      recordBtn.onclick = () => {
        if (mediaRecorder.state === "recording") {
          mediaRecorder.stop();
          //recordBtn.textContent = "record";
          gearL.style.animationPlayState="paused";
          gearR.style.animationPlayState="paused";
          gearL.style.animationName="turnR";
          gearR.style.animationName="turnR";
          console.log("录音结束");
        } else {
          mediaRecorder.start();
          gearL.style.animationPlayState="running";
          gearR.style.animationPlayState="running";
          gearL.style.animationName="turnL";
          gearR.style.animationName="turnL";
          console.log("录音中...");
          //recordBtn.textContent = "stop";
        }
        console.log("录音器状态：", mediaRecorder.state);
      };
      
      player.addEventListener('ended', () => {
        gearL.style.animationPlayState="paused";
        gearR.style.animationPlayState="paused";
        console.log('audio end');
      });
      player.addEventListener('play', () => {
        gearL.style.animationPlayState="running";
        gearR.style.animationPlayState="running";
        console.log('audio play');
      });
      downloadBtn.onclick = () => {
        if(player.src != null){
            var a = document.createElement('a');
            var url = player.src;
            a.href = url;
            a.download = "音声.mp3";
            a.click();
        }
      }
      mediaRecorder.ondataavailable = e => {
        chunks.push(e.data);
      };
      var context = new (window.AudioContext || window.webkitAudioContext)();
      function play(buffer){
        Array.prototype.reverse.call( buffer.getChannelData(0) );
        // var source = context.createBufferSource();
        // source.buffer = buffer;
        // source.connect(context.destination);
        // source.start();
      }
      // Returns Uint8Array of WAV bytes
        function getWavBytes(buffer, options) {
            const type = options.isFloat ? Float32Array : Uint16Array
            const numFrames = buffer.byteLength / type.BYTES_PER_ELEMENT
        
            const headerBytes = getWavHeader(Object.assign({}, options, { numFrames }))
            const wavBytes = new Uint8Array(headerBytes.length + buffer.byteLength);
        
            // prepend header, then add pcmBytes
            wavBytes.set(headerBytes, 0)
            wavBytes.set(new Uint8Array(buffer), headerBytes.length)
        
            return wavBytes
        }
        
        // adapted from https://gist.github.com/also/900023
        // returns Uint8Array of WAV header bytes
        function getWavHeader(options) {
            const numFrames =      options.numFrames
            const numChannels =    options.numChannels || 2
            const sampleRate =     options.sampleRate || 44100
            const bytesPerSample = options.isFloat? 4 : 2
            const format =         options.isFloat? 3 : 1
        
            const blockAlign = numChannels * bytesPerSample
            const byteRate = sampleRate * blockAlign
            const dataSize = numFrames * blockAlign
        
            const buffer = new ArrayBuffer(44)
            const dv = new DataView(buffer)
        
            let p = 0
        
            function writeString(s) {
            for (let i = 0; i < s.length; i++) {
                dv.setUint8(p + i, s.charCodeAt(i))
            }
            p += s.length
            }
        
            function writeUint32(d) {
            dv.setUint32(p, d, true)
            p += 4
            }
        
            function writeUint16(d) {
            dv.setUint16(p, d, true)
            p += 2
            }
        
            writeString('RIFF')              // ChunkID
            writeUint32(dataSize + 36)       // ChunkSize
            writeString('WAVE')              // Format
            writeString('fmt ')              // Subchunk1ID
            writeUint32(16)                  // Subchunk1Size
            writeUint16(format)              // AudioFormat
            writeUint16(numChannels)         // NumChannels
            writeUint32(sampleRate)          // SampleRate
            writeUint32(byteRate)            // ByteRate
            writeUint16(blockAlign)          // BlockAlign
            writeUint16(bytesPerSample * 8)  // BitsPerSample
            writeString('data')              // Subchunk2ID
            writeUint32(dataSize)            // Subchunk2Size
        
            return new Uint8Array(buffer)
        }
      function transform(audioBuffer) {
        // Float32Array samples
        const [left, right] =  [audioBuffer.getChannelData(0),audioBuffer.getChannelData(0)]

        // interleaved
        const interleaved = new Float32Array(left.length + right.length)
        for (let src=0, dst=0; src < left.length; src++, dst+=2) {
        interleaved[dst] =   left[src]
        interleaved[dst+1] = right[src]
        }

        // get WAV file bytes and audio params of your audio source
        const wavBytes = getWavBytes(interleaved.buffer, {
        isFloat: true,       // floating point or 16-bit integer
        numChannels: 2,
        sampleRate: 48000,
        })
        const wav = new Blob([wavBytes], { type: 'audio/wav' })
        var audioURL = window.URL.createObjectURL(wav);
        player.src = audioURL;
      }
      mediaRecorder.onstop = e => {
        var blob = new Blob(chunks, { type: "audio/ogg; codecs=opus" });
        var blobTrans = null;
        chunks = [];
        var reader = new FileReader();
        reader.onload = ()=>{
            context.decodeAudioData(reader.result,(buffer)=>{
                play(buffer);
                transform(buffer);
                player.play();
            },()=>{console.log("error");});
        }
        reader.readAsArrayBuffer(blob);

      };
    },
    () => {
      console.error("授权失败！");
    }
  );
} else {
  console.error("浏览器不支持 getUserMedia");
}