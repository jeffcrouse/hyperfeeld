#!/bin/bash

# Invoke the Forever module (to START our Node.js server).
forever start -a \
	--minUptime 1000ms \
	--spinSleepTime 1000ms \
	-l forever.log \
	-o out.log \
	-e err.log \
	app.js