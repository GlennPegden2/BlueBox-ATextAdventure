# BlueBox - A Text Adventure
Part old school telephony/PSTN/POST BlueBox tutorial, part text adventure. This adventure game doesn't have a text parser, it has a tone parser that should work with any real-world / software "bluebox". Learn how to Phone Phreak like it's 1979!

Implemented as just a simple web page (html/js) using WebAudio

To be debuted at the Retro Hands-On-Hacking village at BSides Leeds 2024

Orginally part of the RetroNetSec Project, but split out as it works just fine as a stand alone thing

Usage :

On your own websever 

The entire this is just html/js/css/image, so just dump in wherever your public content on your webserver is

Via docker 

docker run -p 8080:8080 ghcr.io/glennpegden2/bbata:latest 

and that point your web browser to localhost:8080
