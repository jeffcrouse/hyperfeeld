Hyperfeel Server
=========
This app has 3 purposes:

* BrainProxy apps connect to port a websocket on 8081 to send MindWave data
* Vizualization apps connect to a websocket on port 8080 to receive Journey data
* A tool at [http://localhost:3000/simulator](http://localhost:3000/simulator) simulates the behavior of the BrainProxy for those (Lars) who don't have the MindWave/BrainProxy devices

##To run
* ```cd hfserver```
* ```npm install```
* ```node app.js```
* visit [http://localhost:3000](http://localhost:3000)




## CentOS Stuff

For node-midi (still doesn't find /dev/snd/seq)

```
yum install alsa-lib-devel
yum install jack-audio-connection-kit jack-audio-connection-kit-devel
```

To open ports for websockets

```
iptables -I INPUT -p tcp --dport 8080 -j ACCEPT
iptables -I INPUT -p tcp --dport 8081 -j ACCEPT
service iptables save
```
