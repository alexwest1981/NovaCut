const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const outDir = path.join(__dirname, '..', 'src', 'assets', 'overlays');
if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
}

const overlays = [
    {
        file: '35mm_real_film_grain_loop.mp4',
        filter: 'color=c=black:s=1280x720:d=6:r=24,noise=alls=35:allf=t+u'
    },
    {
        file: '16mm_vintage_dust_scratches.mp4',
        filter: 'color=c=black:s=1280x720:d=6:r=24,noise=alls=25:allf=t+u,drawgrid=w=180:h=720:t=1:c=white@0.35'
    },
    {
        file: '8mm_retro_film_burn.mp4',
        filter: 'color=c=darkorange@0.2:s=1280x720:d=6:r=24,noise=alls=40:allf=t+u,drawbox=x=0:y=0:w=1280:h=720:color=red@0.15:t=fill'
    },
    {
        file: 'golden_light_leaks_overlay.mp4',
        filter: 'color=c=black:s=1280x720:d=6:r=24,drawbox=x=200:y=0:w=400:h=720:color=gold@0.4:t=fill,boxblur=20:1'
    },
    {
        file: 'prism_rainbow_flare.mp4',
        filter: 'color=c=black:s=1280x720:d=6:r=24,drawbox=x=300:y=150:w=300:h=300:color=cyan@0.35:t=fill,drawbox=x=350:y=180:w=250:h=250:color=magenta@0.35:t=fill,boxblur=25:1'
    },
    {
        file: 'blue_anamorphic_streak.mp4',
        filter: 'color=c=black:s=1280x720:d=6:r=24,drawbox=x=0:y=300:w=1280:h=30:color=deepskyblue@0.5:t=fill,boxblur=15:1'
    },
    {
        file: 'floating_fire_embers.mp4',
        filter: 'color=c=black:s=1280x720:d=6:r=24,noise=alls=15:allf=t+u,drawgrid=w=120:h=90:t=2:c=orange@0.8'
    },
    {
        file: 'rolling_smoke_fog_loop.mp4',
        filter: 'color=c=black:s=1280x720:d=6:r=24,drawbox=x=0:y=200:w=1280:h=500:color=white@0.2:t=fill,boxblur=40:2'
    },
    {
        file: 'rain_glass_overlay.mp4',
        filter: 'color=c=black:s=1280x720:d=6:r=24,drawgrid=w=80:h=30:t=1:c=lightblue@0.6,noise=alls=10:allf=t+u'
    },
    {
        file: 'snow_blizzard_overlay.mp4',
        filter: 'color=c=black:s=1280x720:d=6:r=24,drawgrid=w=60:h=60:t=2:c=white@0.7,noise=alls=15:allf=t+u'
    },
    {
        file: 'golden_bokeh_particles.mp4',
        filter: 'color=c=black:s=1280x720:d=6:r=24,drawbox=x=300:y=200:w=60:h=60:color=gold@0.4:t=fill,drawbox=x=500:y=250:w=80:h=80:color=khaki@0.3:t=fill,boxblur=20:1'
    },
    {
        file: 'vhs_tracking_glitch.mp4',
        filter: 'color=c=black:s=1280x720:d=6:r=24,noise=alls=35:allf=t+u,drawgrid=w=1280:h=80:t=8:c=white@0.4'
    },
    {
        file: 'crt_scanlines_tv_overlay.mp4',
        filter: 'color=c=black:s=1280x720:d=6:r=24,drawgrid=w=1280:h=4:t=1:c=white@0.22,noise=alls=12:allf=t+u'
    },
    {
        file: 'matrix_green_code_rain.mp4',
        filter: 'color=c=black:s=1280x720:d=6:r=24,drawgrid=w=40:h=30:t=1:c=lime@0.7,noise=alls=20:allf=t+u'
    },
    {
        file: 'cyber_rgb_glitch_overlay.mp4',
        filter: 'color=c=black:s=1280x720:d=6:r=24,noise=alls=40:allf=t+u,drawgrid=w=300:h=60:t=4:c=cyan@0.6'
    },
    {
        file: 'cctv_security_camera_osd.mp4',
        filter: 'color=c=black:s=1280x720:d=6:r=24,drawbox=x=40:y=40:w=20:h=20:color=red@0.9:t=fill,drawbox=x=40:y=40:w=1200:h=640:color=white@0.3:t=1'
    },
    {
        file: 'dslr_viewfinder_hud.mp4',
        filter: 'color=c=black:s=1280x720:d=6:r=24,drawbox=x=610:y=350:w=60:h=20:color=white@0.5:t=1,drawbox=x=630:y=330:w=20:h=60:color=white@0.5:t=1'
    },
    {
        file: 'cinema_letterbox_239.mp4',
        filter: 'color=c=black:s=1280x720:d=6:r=24,drawbox=x=0:y=0:w=1280:h=90:color=black:t=fill,drawbox=x=0:y=630:w=1280:h=90:color=black:t=fill'
    },
    {
        file: 'super8_rounded_frame_overlay.mp4',
        filter: 'color=c=black:s=1280x720:d=6:r=24,drawbox=x=0:y=0:w=80:h=720:color=black:t=fill,drawbox=x=1200:y=0:w=80:h=720:color=black:t=fill,drawbox=x=0:y=0:w=1280:h=50:color=black:t=fill,drawbox=x=0:y=670:w=1280:h=50:color=black:t=fill'
    },
    {
        file: 'retro_80s_laser_grid.mp4',
        filter: 'color=c=black:s=1280x720:d=6:r=24,drawgrid=w=80:h=40:t=1:c=magenta@0.5,drawbox=x=0:y=0:w=1280:h=360:color=black:t=fill'
    }
];

console.log(`Generating ${overlays.length} overlay video loops in ${outDir}...`);

for (const item of overlays) {
    const target = path.join(outDir, item.file);
    if (fs.existsSync(target) && fs.statSync(target).size > 1000) {
        console.log(`[OK] Already exists: ${item.file}`);
        continue;
    }
    const cmd = `ffmpeg -y -f lavfi -i "${item.filter}" -c:v libx264 -preset ultrafast -pix_fmt yuv420p "${target}"`;
    try {
        execSync(cmd, { stdio: 'ignore' });
        console.log(`[Created] ${item.file}`);
    } catch (e) {
        console.error(`[Error] Failed generating ${item.file}:`, e.message);
    }
}

console.log('All overlays generated successfully!');
