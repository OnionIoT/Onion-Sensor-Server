#!/bin/sh

if [ "$1" == "" ]; then
	ADDR="0x48"
else
	ADDR="$1"
fi

echo $(($(i2cget -y 0 $ADDR 00 w | sed -e 's/0x\(..\)\(..\)/0x\2\1/')/16))*0.0625 | bc -l
