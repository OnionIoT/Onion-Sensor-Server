Hex=`i2cget -y 0 0x48 0x00 w`
while [ $Hex -ne 0 ]
do
	DecNum=`printf "%d" $1`
	Binary=
	Number=$DecNum

	while [ $DecNum -ne 0 ]
	do
		Bit=$(expr $DecNum % 2)
		Binary=$Bit$Binary
		DecNum=$(expr $DecNum / 2)
	done

	shift
	# Shifts command line arguments one step.Now $1 holds second argument
done

echo $Binary
