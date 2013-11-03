Hyperfeel Server
=========

Along with [hyperfeel-ios](https://github.com/jefftimesten/Hyperfeel-ios) and [hyperfeel-viz](https://github.com/jefftimesten/hyperfeel-viz), makes up the [Nike Hyperfeel Experiment](http://www.coolhunting.com/tech/nike-art-science-of-feeling-hyperfeel-nyc.php) by [Odd Division](http://odddivision.com/)


## Purposes
- Accepts and saves user "Journeys" from the [hyperfeel-ios](https://github.com/jefftimesten/Hyperfeel-ios) devices
- Vizualization apps connect to a websocket on port 8080 to receive Journey data
- A tool at /simulator simulates the behavior of the BrainProxy for those (Lars) who don't have the MindWave/BrainProxy devices

##To run
* ```cd hyperfeeld```
* ```npm install```
* ```node app.js```
* visit [http://localhost:3000](http://localhost:3000)


## Notes

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
