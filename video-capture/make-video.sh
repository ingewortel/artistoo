ffmpeg -y -framerate 50 -i frames/%05d.png -vcodec h264 -r 30 -pix_fmt yuv420p -crf 17 o.mp4 

