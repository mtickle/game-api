
//--- Imports
import cors from 'cors';
import express, { json } from 'express';
import rateLimit from 'express-rate-limit';
import fs from 'fs';
import morgan from 'morgan';


//--- Implement rate limiting.
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // Set a 15 minute window
    max: 1000000, // Set a maximum request limit per IP per window.
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
})

//--- Set the proper header because CORS
var corsOptions = {
    origin: '*'
}

//--- Manage some things on the APP: Express and CORS
const app = express();
app.use(json());
app.use(limiter);
app.use(cors(corsOptions));


//--- Logging
app.use(morgan('common', {
    stream: fs.createWriteStream('./access.log', { flags: 'a' })
}));

//--- Routes
// //--- Name and implement the ROUTES
import routes from 'routes.js';
app.use('/api', routes)

//--- Open the SERVER
app.listen(3001, () => {
    console.log(`API listening on ${8080}`)
})