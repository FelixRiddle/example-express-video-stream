import cors from "cors";
import 'dotenv/config';
import express, { Request, Response } from 'express';
import fs from 'fs';
import Throttle from 'throttle';

const app = express();
const port = 38004;

app.use(cors());

// Video path
const videoPath = '/home/felix/Videos/Minecraft/gp-1.mkv';

app.get('/video', (req: Request, res: Response) => {
    try {
        
        // Get video information
        const stat = fs.statSync(videoPath);
        
        // Get file size
        const fileSize = stat.size;
        
        // Size range
        const range = req.headers.range;
        if(range) {
            const parts = range.replace(/bytes=/, '').split('-');
            const start = parseInt(parts[0], 10);
            const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
            
            const chunkSize = end - start + 1;
            const file = fs.createReadStream(videoPath, { start, end });
            const head = {
                'Content-Range': `bytes ${start}-${end}/${fileSize}`,
                'Accept-Ranges': 'bytes',
                'Content-Length': chunkSize,
                'Content-Type': 'video/mkv',
            };
            
            res.writeHead(206, head);
            file.pipe(res);
        } else {
            // Send the video file size and type
            const head = {
                'Content-Length': fileSize,
                'Content-Type': 'video/mkv',
            };
            
            res.writeHead(200, head);
            fs.createReadStream(videoPath).pipe(res);
        }
    } catch(err) {
        console.error(err);
    }
});

app.get('/download', (req, res) => {
    try {
        const stat = fs.statSync(videoPath);
        const fileSize = stat.size;
        
        res.writeHead(200, {
            'Content-Type': 'video/mkv',
            'Content-Disposition': 'attachment; filename=gp-1.mkv',
            'Content-Length': fileSize,
        });
        
        const readStream = fs.createReadStream(videoPath);
        // Throttle to 5MB/sec - simulate lower speed
        // Also useful for anti DDOS
        const throttle = new Throttle(1024 * 1024 * 5);
        readStream.pipe(throttle);
        
        throttle.on('data', (chunk) => {
            console.log(`Sent ${chunk.length} bytes to client.`);
            res.write(chunk);
        });
        
        throttle.on('end', () => {
            console.log('File fully sent to client.');
            res.end();
        });
    } catch(err) {
        console.error(err);
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
