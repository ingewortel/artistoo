ffmpeg -y -framerate 120 -i frames/%05d.png -vcodec h264 \
	-filter:v "crop=600:296:200:2" -r 30 -pix_fmt yuv420p -movflags +faststart -crf 2 o.mp4 

