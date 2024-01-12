import React, { useRef, useEffect, useState } from 'react';
import Plyr from 'plyr';
import 'plyr/dist/plyr.css';

function HomePanel({ popularMedia }) {
 if (popularMedia == null) {
   return <p>Loading...</p>;
 }

 const [currentIndex, setCurrentIndex] = useState(0);
 const [source, setSource] = useState(null);
 const playerRef = useRef(null);

 const handlePrevClick = () => {
   setCurrentIndex(prevIndex => (prevIndex - 1 + popularMedia.length) % popularMedia.length);
 };

 const handleNextClick = () => {
   setCurrentIndex(prevIndex => (prevIndex + 1) % popularMedia.length);
 };

useEffect(() => {
 setSource(`https://www.youtube.com/watch?v=${popularMedia[currentIndex].trailer.id}&controls=0&modestbranding=1&showinfo=0&cc_load_policy=3`);
}, [currentIndex]);

useEffect(() => {
 if (playerRef.current) {
   const player = new Plyr(playerRef.current, {
     captions: { active: false }
   });

   player.on('pause', () => {
     player.play();
   });

   setTimeout(() => {
     player.play();
   }, 2000);
 }
}, [source]);

 return (
   <div>
     <button onClick={handlePrevClick}>Previous</button>
     <button onClick={handleNextClick}>Next</button>
     <div ref={playerRef}>
       <iframe
         src={source}
          allow="accelerometer; encrypted-media; gyroscope; picture-in-picture"
       ></iframe>
     </div>
   </div>
 );
}

export default HomePanel;
