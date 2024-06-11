class tones {

  ss5 = {

    Freqs : [
      700, 900, 1100, 1300, 1500, 1700, 2400, 2600
    ],
  
    Chars : [
      ["SS5X", "SS51", "SS52", "SS54", "SS57", "SS5ST3", "SS5SZ2400", "SS5SZ2600"],
      ["SS51", "SS5X", "SS53", "SS55", "SS58", "SS5ST2", "SS5SZ2400", "SS5SZ2600"],
      ["SS52", "SS53", "SS5X", "SS56", "SS59", "SS5KP", "SS5SZ2400", "SS5SZ2600"],
      ["SS54", "SS55", "SS56", "SS5X", "SS50", "SS5KP2", "SS5SZ2400", "SS5SZ2600"],
      ["SS57", "SS58", "SS59", "SS50", "SS5X", "SS5ST", "SS5SZ2400", "SS5SZ2600"],
      ["SS5ST3", "SS5ST2", "SS5KP", "SS5KP2", "SS5ST", "SSSTX", "SS5SZ2400", "SS5SZ2600"],
      ["SS5SZ2400", "SS5SZ2400", "SS5SZ2400", "SS5SZ2400", "SS5SZ2400", "SS5SZ2400", "SS5SZMF", "SS5SZMF"],
      ["SS5SZ2600", "SS5SZ2600", "SS5SZ2600", "SS5SZ2600", "SS5SZ2600", "SS5SZ2600", "SS5SZ2MF", "SS5SZMF"]
    ],

    last: "",
    counter: ""

  }
    
  dtmf = {

    Freqs: [
      [697, 770, 852, 941],
      [1209, 1336, 1477, 1633]
    ],
    
    Chars: [
      ["DTMF1", "DTMF2", "DTMF3", "DTMFA"],
      ["DTMF4", "DTMF5", "DTMF6", "DTMFB"],
      ["DTMF7", "DTMF8", "DTMF9", "DTMFC"],
      ["DTMF*", "DTMF0", "DTMF#", "DTMFD"],
    ],

    last: "",
    counter: ""
  }
  
}
    class Sender {
        constructor(options = {}) {

          var tc = new tones();

          var audioContext = new(window.AudioContext || window.webkitAudioContext);
          var grid = [];
          for (var i = 0; i < tc.dtmf.Freqs[0].length; i++) {
            var row = [];
            var freq1 = tc.dtmf.Freqs[0][i];
            for (var j = 0; j < tc.dtmf.Freqs[1].length; j++) {
              var freq2 = tc.dtmf.Freqs[1][j];
              var button = {};
              button.gain1 = audioContext.createGain();
              button.gain1.gain.value = 0.0;
              button.gain1.connect(audioContext.destination);
      
              button.osc1 = audioContext.createOscillator();
              button.osc1.type = "sine";
              button.osc1.frequency.value = freq1;
              button.osc1.connect(button.gain1);
      
              button.osc2 = audioContext.createOscillator();
              button.osc2.type = "sine";
              button.osc2.frequency.value = freq2;
              button.osc2.connect(button.gain1);
      
              button.osc1.start(0);
              button.osc2.start(0);
      
              row.push(button);
            }
            grid.push(row);
          }
          this.options = options;
          this.audioContext = audioContext;
          this.grid = grid;
        }
        play(str, cb) {
          if (!cb) cb = function () {};
          if (!str) return cb();

          var tc = new tones();

          var seq = str.split("");
          var grid = this.grid;
          var duration = this.options.duration || 100;
          var pause = this.options.pause || 40;
          var doPlay = function () {
            var char = seq.shift();
            if (!char) return cb();
            var i, j;
            loop1:
            for (i = 0; i < tc.dtmf.Chars.length; i++) {
              for (j = 0; j < tc.dtmf.Chars[i].length; j++) {
//                console.log("checking "+tc.dtmf.Chars[i][j]+" against "+char);
                if (tc.dtmf.Chars[i][j] == "DTMF" + char) break loop1;
              }
            }

            console.log("playing tone "+str+" i:"+i+" j:"+j);

            var button = grid[i][j];
            if (button) {
              button.gain1.gain.value = 1.0;
              setTimeout(function () {
                button.gain1.gain.value = 0.0;
                setTimeout(doPlay, pause);
              }, duration);
            } else {
              return cb();
            }
          };
          doPlay();
        }
        destory() {
          if (this.audioContext) {
            if (typeof this.audioContext.close === "function") {
              this.audioContext.close();
            }
            this.audioContext = null;
          }
        }
      }
      
    class Receiver  {
        constructor(options = {}) {
          this.options = options;
        }


        lastTone = "";

        start(stream, cb) {
          if (this._timer || !cb) return;
      
          this.audioContext = new(window.AudioContext || window.webkitAudioContext);
      
          var src = this.audioContext.createMediaStreamSource(stream);
          var analyser = this.audioContext.createAnalyser();
          analyser.fftSize = 1024;
          analyser.smoothingTimeConstant = 0;
          src.connect(analyser);
      
          var freqs = new Uint8Array(analyser.frequencyBinCount);
          var binWidthInHz = this.audioContext.sampleRate / freqs.length / 2;
      
          function findDtmfIndex(data, xdtmfFreqs, binWidthInHz) {
            var max = 0;
            var index = -1;
            var imax = 0; 
            for (var i = 0; i < xdtmfFreqs.length; i++) {
              var bin = Math.round(xdtmfFreqs[i] / binWidthInHz);
//              if (i >=0 && data[bin] >= triggerVol) { console.log(i+" "+bin+" "+data[bin]+" "+xdtmfFreqs[i])}
              if (data[bin] > max) {
                max = data[bin];
                index = i;
                imax = max;
              }
            }
              return [index,imax];
          }


          function countTones(t1,t2,toneType,cb) {

//            var step = this.options.step || 20; // was 20
            var step = 20; // was 20
            var last = "";
            var counter = 0;
            var c = "";  
            var minLen = 1;
            var maxLen = 3;  


            var minCnt = 0
            var maxCnt = 0


            if ((toneType == 0) || (toneType == 1)){
              // DTMF normal || // DMF Lonf
              if (toneType == 1) {
                //DTMF Long (ABCD)
                minLen = 3;
                maxLen = 3;  
              } else {
                //DTMF Normal
                minLen = 0.4;
                maxLen = 9;  
              }
              c = tc.dtmf.Chars[t1][t2]; 
              last = tc.dtmf.last;
              tc.dtmf.counter++;
              counter = tc.dtmf.counter;
              tc.dtmf.last = c 
            } else if (toneType == 2) {
              // SS5
              minLen = 0.6;
              maxLen = 5;
              c = tc.ss5.Chars[t1][t2];  
              last = tc.ss5.last;
              tc.ss5.counter++;
              counter = tc.ss5.counter;
              tc.ss5.last = c 
            } else if (toneType == 3) {
              // CLEAR 
              c = "CLR";
              if ((tc.ss5.last != c) || (tc.dtmf.last != c)) {
                console.log("Clear");
                tc.ss5.last = c;
                tc.dtmf.last = c;
                last = c
                counter = (step * 0.75)*minLen + 1;
              }
            }

            var minCnt = (step * 0.75)*minLen
            var maxCnt = (step * 0.75)*maxLen


            if (last == c) {
              console.log("Counting Tone "+c+" = "+t1+","+t2+" Counter was "+counter+" of "+minCnt+", type was "+toneType);
              if (counter > minCnt) {
                  console.log("Raising tone event");

                  if ((toneType == 0) || (toneType == 1)) {
                    tc.dtmf.counter = 0;
                  } else if (toneType == 2) {
                    tc.ss5.counter = 0;
                  }

                  cb(c);
              }
            } else {
//              console.log("Different Tone "+c+"("+toneType+"). Stopping count");
              if ((toneType == 0) || (toneType == 1)) {
//                tc.dtmf.counter = 0;
              } else if (toneType == 2) {
//                tc.ss5.counter = 0;
              } else if (toneType == 3) {
                tc.ss5.counter = 0;
                tc.dtmf.counter = 0;
              } else {
                console.log("Unknown ToneType "+toneType);  
              }
            }

          }

          var tc = new tones();

          var duration = this.options.duration || 100; // Was 100
          var step = this.options.step || 20; // was 20
          var triggerVol = this.options.tVol || 230 // was 200
      
          this._timer = setInterval(function () {
            analyser.getByteFrequencyData(freqs);
            var max = 0;
            for (var i = 0; i < freqs.length; i++) {
              if (freqs[i] > max) max = freqs[i];
            }
            var [x,xVol] = findDtmfIndex(freqs, tc.tc.dtmf.Freqs[0], binWidthInHz);
            var [y,yVol] = findDtmfIndex(freqs, tc.tc.dtmf.Freqs[1], binWidthInHz);
            var [z,zVol] = findDtmfIndex(freqs, tc.ss5.Freqs, binWidthInHz);


            if (z >= 0) {
                var sfc = tc.ss5.Freqs.slice();
                sfc[z] = -999; 
                var [z2,z2Vol] = findDtmfIndex(freqs, sfc, binWidthInHz);
            }  else {
              z2 = -1
            }
              

            //Do we have a loud tone?
            if (((x >= 0 && xVol >= triggerVol) && (y >= 0 && yVol >= triggerVol)) || ((z >= 0 && zVol >= triggerVol)  || (z2 >= 0 && z2Vol >= triggerVol))) {

                // Warning: Enabling this debug slows things down, which screws with the tone length detection:
                // console.log("Valid Tones: DMTM1 "+x+" (Vol "+xVol+") | DTMF2 "+y+" (Vol "+yVol+") | MF1 "+z+" (Vol "+zVol+") "+z2+" MF2 (Vol "+z2Vol+") ");

                // 2400 / 2600 are special single-tone cases, but present them on both side to support them as a special case
                if (((z == 6 ) && (z2 != 7))|| ((z == 7) && ( z2 != 6)))  { 
                  z2 = z; z2Vol = zVol;
                } else if (((z2 == 6) && (z != 7)) || (z2 == 7)  && ( z != 6))  { 
                  z = z2; zVol = z2Vol;
                };
              

                var dtmfVol = (xVol+yVol);
                var mfVol = (zVol+z2Vol)

                  if ((xVol >= (triggerVol)) && (yVol >= (triggerVol))) {
                    if (y == 3) {
                      // Long DTMF  
                      countTones(x,y,1,cb);
                    } else {
                      // Short DTMF
                     countTones(x,y,0,cb);
                    } 
                  } 
                  
                  if ((zVol >= triggerVol) && (z2Vol >= triggerVol)) {
                    countTones(z,z2,2,cb)
                  }
                                  
            } else {
              // Clear
              countTones(0,0,3,cb)
            }

          }, duration / step);
        }
        stop() {
          clearInterval(this._timer);
          this._timer = null;
          if (this.audioContext) {
            if (typeof this.audioContext.close === "function") {
              this.audioContext.close();
            }
            this.audioContext = null;
          }
        }
      }
      


