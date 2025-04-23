import React, { useMemo } from 'react';
import { getRandomItemFromArray } from '@/lib/utils';
import { memes, titles } from '@/assets/memes';

interface MemePersonaProps {
  performance: 'excellent' | 'good' | 'neutral' | 'bad' | 'terrible';
  compact?: boolean;
}

const MemePersona: React.FC<MemePersonaProps> = ({ performance, compact = false }) => {
  const persona = useMemo(() => {
    // Filter memes and titles by performance level
    const filteredMemes = memes.filter(meme => meme.performance === performance);
    const filteredTitles = titles.filter(title => title.performance === performance);
    
    // Select a random meme and title
    const selectedMeme = getRandomItemFromArray(filteredMemes);
    const selectedTitle = getRandomItemFromArray(filteredTitles);
    
    return {
      meme: selectedMeme,
      title: selectedTitle
    };
  }, [performance]);

  if (compact) {
    return (
      <div className="flex items-center space-x-3">
        <img 
          src={persona.meme.src} 
          alt={persona.meme.alt} 
          className="w-12 h-12 rounded-md object-cover border border-white/10"
        />
        <div className="text-sm">
          <div className="text-cyber-yellow font-pixel">{persona.title.title}</div>
          <div className="text-white text-xs">{persona.title.description}</div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="cyber-card p-4 w-full md:w-auto bg-cyber-dark/70 border border-white/10 text-center">
      <div className="mb-2">
        <img 
          src={persona.meme.src} 
          alt={persona.meme.alt} 
          className="w-24 h-24 mx-auto rounded-md object-cover" 
        />
      </div>
      <div className="font-pixel text-cyber-yellow text-sm mb-1">YOUR CRYPTO RANK</div>
      <div className="text-white font-bold text-lg">{persona.title.title}</div>
      <p className="text-xs text-gray-300 mt-1">{persona.title.description}</p>
    </div>
  );
};

export default MemePersona;
