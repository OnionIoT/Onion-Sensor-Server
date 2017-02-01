from OmegaExpansion import onionI2C
import sys

devAddr = 0x48

if (len(sys.argv) >= 3):
	sys.exit ("127\nToo many arguments\n")

if (len(sys.argv) == 2):
	devAddr = int(sys.argv[1],16)


sensor = onionI2C.OnionI2C()
rawData = sensor.readBytes(devAddr, 0x00, 2)
data = rawData[0] * 1.0 + rawData[1]*(0.0625/16)

sys.exit(str(data) + '\nAll good.')

