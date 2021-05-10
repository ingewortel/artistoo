argv <- commandArgs( trailingOnly = TRUE )


library( ggplot2 )
library( dplyr )

d <- read.table( argv[1] )

colnames(d) <- c("build", "benchmark", "ex", "time" )

d$time <- as.numeric( gsub( "s", "", d$time ) )
d$build <- factor( d$build, c("old","new") )

dsum <- d %>% 
	group_by( build, benchmark ) %>%
	summarise( meanTime = mean(time),
				sdTime = sd(time) )
				
print( dsum )

cols <- c( "old" = "gray", "new" = "dodgerblue" )

p <- ggplot( d, aes( x = build, y = time, color = build ) ) +
	geom_errorbar( data = dsum, aes( y = meanTime, ymin = meanTime - sdTime, 
		ymax = meanTime + sdTime ), width = 0.4 ) +
	geom_segment( data = dsum, aes( x = as.numeric(build) -0.3, 
		xend = as.numeric(build)+0.3, y = meanTime, yend = meanTime ),
		color = "black" ) +
	ggbeeswarm::geom_quasirandom( ) + 
	scale_color_manual( values = cols ) +
	scale_y_continuous( limits=c(0,NA)  ) +
	facet_wrap( ~benchmark, scales="free_y" ) +
	theme_bw() +
	theme( panel.grid = element_blank(),
		text = element_text( size = 7 ) )
	
ggsave( "test.pdf", width = 12, height = 8, units = "cm" )