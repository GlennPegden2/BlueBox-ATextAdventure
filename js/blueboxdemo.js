class PhoneNetwork {
    constructor() {
    }

    lastevent = "";

    //home, lex, rex, fpn, ppn, trun
    home  = {
        offhook: false,
        dialtone: false,
        connected: false,
        dailedNumber: "",
        number: "34893"
    };

    lex = {
        lineup: false,
        linesiezed: false,
        connected: false,
        trunkdialed: ""
    }

    ppn = {
        number: "0016304852995",
        connected: false
    }

    fpn = {
        number: "0800890808",
        connected: false
    }

    eventcount = 0;

    updateStatus() {

        var divhook = document.getElementById("hook")
        var divdialtone = document.getElementById("dialtone")
        var divdialednumber = document.getElementById("dialednumber")
        var divconnected = document.getElementById("connected")
        var divlexconnected = document.getElementById("lexconnected")
        var divlexline = document.getElementById("lexline")


        if (this.home.offhook) {
            divhook.innerHTML = "Phone Reciever (Handset): Off Hook";
        } else {
            divhook.innerHTML = "Phone Reciever (Handset): On Hook";
        }    

        if (this.home.dialtone) {
            if (this.home.dailedNumber =="" ) {
                divdialtone.innerHTML = "Phone Audio: Dialtone present";
            } else {
                divdialtone.innerHTML = "Phone Audio: Quiet (dialing in progress)";
            }

        } else {
            divdialtone.innerHTML = "Phone Audio: No dialtone (silent)";
        }    

        divdialednumber.innerHTML = "Dailed Number: "+this.home.dailedNumber+"";

        if (this.home.connected) {
            divconnected.innerHTML = "Connected to: "+this.home.dailedNumber;
        } else {
            divconnected.innerHTML = "Not connected a number";
        }    

        if (this.lex.connected) {
            divlexconnected.innerHTML = "Connected to Exchange: Yes";
        } else {
            divlexconnected.innerHTML = "Connecte to Exchange: No";
        }

        if (this.lex.lineup) {
            if (this.lex.linesiezed) {
                divlexline.innerHTML = "Line: Siezed";
            } else {
                divlexline.innerHTML = "Line: Up";
            }
        } else {
            divlexline.innerHTML = "Line: Down";
        }

    }

    addToEventLog(text) {
        var diveventlog = document.getElementById("eventlog")
        diveventlog.innerHTML += "["+this.eventcount+"] "+text+"<br/>";
    }

    addToOputput(text) {
        var textboxt = document.getElementById("output")
        textboxt.innerHTML += "<p>"+text+"</p>";
    }

    processKey(event) {
        this.processEvent(event);
        this.processEvent("CLR");
    }

    processEvent (event) {

        var divhook = document.getElementById("hook")
        var divdialtone = document.getElementById("dialtone")
        var divdialednumber = document.getElementById("dialednumber")
        var divconnected = document.getElementById("connected")
        var divlexconnected = document.getElementById("lexconnected")
        var divlexline = document.getElementById("lexline")

        this.eventcount += 1;    
        
        console.log("New Event: "+this.eventcount+" "+event);

        if ((event.substring(0,2) == "SS") || (event.substring(0,4) == "DTMF" ) || (event.substring(0,2) == "R1") || (event == "CLR")){
            // It's a tone!

            if (event == this.lastevent) {
                console.log("Suppressed detection of multiple same tone / long tone "+event)
            } else if (event == "CLR") {
                console.log("Clear recieved");
                this.lastevent = "";
            } else if ((this.home.offhook == false) ) {
                this.addToOputput("You may have tried dialing "+event+", or it may be background noise, either way the reciever is on the hook, so nothing happens");
                this.addToEventLog("Local phone heard "+event+" (ignored, onhook)");
            } else if (event.substring(0,4) == "DTMF" ) {
                    if (this.home.dialtone == true) {

                        this.home.dailedNumber += event.substring(4,5)
                        this.addToEventLog("Local phone heard "+event+" (forwarded to localexchange). Local exchange heard "+event+ " (waiting for complete number)");
                        if (divdialednumber.style.visibility == "hidden") {
                            this.addToOputput("You play a tone associated with dialing a number on the reciever. Congratulations! You have discovered the playing DTMF tones gives just the same result as pressing the number keys on your phone. Now to try dialing a whole phone number");
                            divdialednumber.style.visibility = "visible";
                        }            

                        if ((this.home.dailedNumber != this.fpn.number.substring(0,this.home.dailedNumber.length)) && (this.home.dailedNumber != this.ppn.number.substring(0,this.home.dailedNumber.length))) {
                            this.addToOputput("Warning: You have dialed "+this.home.dailedNumber+" and this demo only supports two numbers. "+this.ppn.number+" and "+this.fpn.number+", so what you are doing probably isn't going to work. Try putting the phone back on the hook and taking it off again to restart dialing");  
                        }      
    

                    } else {
                        if (this.home.connected) {
                            this.addToEventLog("Local phone heard "+event+" (ignored as no dialtone, forwarded to remote exchange)");
                        } else {
                            this.addToEventLog("Local phone heard "+event+" (ignored as no dialtone, not forwarded as no connection)");
                        }
                    }    


            } else if ((event.substring(0,2) == "SS" || event.substring(0,2) == "R1" )) {

                    if (this.home.connected) {
                        this.addToEventLog("Local phone heard "+event+" (ignored, forwarded to localexchange)");
                        if (event != "SS5SZ2600" && event != "SS5SZ2400" && event != "SS5SZMF") {
                            this.addToEventLog("Local exchange heard "+event+ " (ignored as line is already connected to remote exchange)");                             
                        } else {
                            this.processEvent("Sieze");
                        }


                    } else if (this.lex.lineup) {
                        if (this.lex.linesiezed) {

                            this.addToEventLog("Exchange heard trunk command "+event+" ");
                            if (event == "SS5KP") {
                                    this.home.dailedNumber = "KP";
                                    this.addToOputput("You play a KP tone, which makes the trunk think it's about to revcieve a number to dial. Normally only the exchange can send these numbers, but as you seized the trunk, you now can too!");
                            } else if (event.substring(0,5) == "SS5SZ") { 
                                console.log("Seize heard, but line already seized");
                            } else if (event == "SS5ST") { 
                                this.addToOputput("You play a ST tone, this tells the trunk to connect to the number");
                                if (this.home.dailedNumber == ("KP" + this.ppn.number) )  {
                                    this.addToOputput("A few seconds pass and the click, you are connected. Congratulations you have just sucessfully blue boxed. As far as billing systems are concerned you are connected to a free phone 0800 number, but you are actually connected to a paid number");

                                } else {
                                    this.addToOputput("KP+"+event+"ST seems like a valid number, but not the one the demo recognises, try "+this.ppn.number+".");
                                }
                            } else {
                                if (this.home.dailedNumber.substring(0,2) == "KP") {
                                    this.home.dailedNumber += event.substring(3)
//                                    this.addToOputput("You play tones the trunk recognises as valid tones,"+event.substring(3)+". So far the trunk has heard "+this.home.dailedNumber);
                                    console.log("Dialed number is "+this.home.dailedNumber+" (added "+event.substring(3)+")")

                                } else {
                                    this.addToOputput("You play a tone the trunk understands, but you didn't start the message properly.");
                                    console.log("Expected KP, got |"+this.home.dailedNumber+"|");
                                    this.home.dailedNumber = "";
                                }
                            } 

                        } else {
                            this.addToEventLog("Heard "+event+ "(ignored)");

                        }

                    }

            }


            if ((((this.home.dailedNumber == this.ppn.number) || (this.home.dailedNumber == this.fpn.number)) && this.home.connected == false) ||
               (((this.home.dailedNumber == "KP" + this.ppn.number + "ST") || (this.home.dailedNumber == "KP" + this.fpn.number + "ST")) && this.lex.linesiezed == true)) {
                    this.processEvent("Connected");
            } else if (this.home.dailedNumber == "0800 500005") {
                this.addToOputput("Your Easter Egg hunting is admirable, but fruitless. BTW whilst BT not longer update this number with news, it is still in service with just a test message on it. Try it now in the real world.");
                this.addToOputput("Frustrated at the futility of dialing this number, you slack the reciever down.");
                this.processEvent("OnHook");    
            }
            
            
            else {
//                    console.log("DEBUG: checking |"+this.home.dailedNumber+ "| against |"+this.ppn.number+"| and |"+this.fpn.number+"|");
            }


        } else if (event == "Connected") {
            this.home.connected = true;
            this.home.dialtone = false;
            this.lex.lineup = true;
            this.lex.connected = true;

                this.addToEventLog("Local Phone <-> Local Exchange: "+event+".");

                if (divconnected.style.visibility == "hidden") {
                    this.addToOputput("You finish dialing a valid number. There is a brief click and the phone now makes a traditional \"ring tone\" noise. Notice how unlike digital systems, there is no send button, the exchange decided when you had completed the number, not you.");
                    divconnected.style.visibility = "visible";
                    divlexconnected.style.visibility = "visible";
                    divlexline.style.visibility = "visible";

                }

                if (this.home.dailedNumber == this.ppn.number) { 
                    this.addToOputput("You have connected to a paid number, I hope you have deep pockets, these used to cost a fortune! In the real world this is actually the awesome ProjectMF Phone Phreaking exchange (but this is just a silly game, not real life). Project MF is a real hardware simulation of a phreakable R1 network, that you can dial for real and try what you learn here!");
                    this.addToOputput("As you want to finish this game, how about finding out how to dial this number WITHOUT the big international charges.");
                }

                if (this.home.dailedNumber == this.fpn.number) { 
                    this.addToOputput("Ring Ring ..... \"Welcome to the Trindad &amp; Tobago Tourist Information Line.\"");
                    this.addToOputput("You have connected to a freephone number, these used to be dull (well, apart from 0800 500005 which was BTs daily office news update!). But this one appears to be outside the UK, that makes it special.");
                }
            this.updateStatus();

        } else if (event == "Sieze") {
            if (this.lex.lineup == true) {
                this.addToOputput("Congratulations! You found the frquency and siezed the line. The precise frequency may vary (R1 is 2600hz, others are 2400Hz, SS5 is a combo of 2400Hz and 2600Hz. You're the Captain Now! You are talking to the phone exchance, but it doesn't realise you're even still connected!");
                this.home.connected = false;
                this.lex.connected = true;
                this.lex.linesiezed = true;
                this.home.dailedNumber = ""
                } else {
                    // Not sure this can even get here now
                this.addToOputput("You blow your little Captain Crunch whistle, or press the magic button on your Blue Box and nothing happens. Maybe because you're not connected to the exchange. Try dialing a number!");
            }
        } else if ((this.home.offhook == false) && ((event.substring(0,2) == "SS") || (event.substring(0,4) == "DTMF" ))) {
            this.addToOputput("You try dialing "+event+", but the reciever is on the hook, so nothing happens");

        } else {
            switch (event) {
                case "OffHook": 
                    if (divhook.style.visibility == "hidden") {
                        this.addToOputput("You lift the receiever (handset) and the silent phone now makes a constant, long, buuuuuuuuurrrrrrrb sound.<br/><br/>Congratulations! You have discovered how the reciever (handset) on a pre-digital phone works, if it is on the hook, nothing works, you need to lift if off the hook for anything useful to happen. You have also learnt that when you take a phone off the hook, you should be greeted with a dialtone.");
                        divhook.style.visibility = "visible";
                        divdialtone.style.visibility = "visible";
                    } else {
                        this.addToOputput("You lift the reciever and hear a dialtone");
                    }    

                    this.addToEventLog(" Local Phone: "+event+" ");

                    var hookimg = document.getElementById("hook-img");
                    hookimg.src = "images/OffHook.svg"		

                    this.home.dialtone = true;
                    this.home.connected = false; 
                    this.home.dailedNumber = "";
                    this.home.offhook = true;
                    break;


                case "OnHook": 
                    this.addToOputput("You put the reciever back down and no longer hear anything from the phone");
                    this.home.dialtone = false;
                    this.home.connected = false; 
                    this.home.offhook = false;
                    this.home.dailedNumber = "";
                    this.lex.lineup = false;
                    this.lex.connected = false;
                    this.lex.linesiezed = false;
                    
                    var hookimg = document.getElementById("hook-img");
                    hookimg.src = "images/OnHook.svg"		

                    this.addToEventLog(" Local Phone: "+event+" ");
                    break;

            }     
        }    

        this.lastevent = event;    
        this.updateStatus();

    }
  }