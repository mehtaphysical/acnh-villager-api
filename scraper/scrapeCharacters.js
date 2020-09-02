const request = require('superagent');
const cheerio = require('cheerio');

const fandomURL = 'https://animalcrossing.fandom.com';
const charLinkSelector = '#mw-content-text > table:nth-child(5) > tbody > tr:nth-child(2) > td > table > tbody';
const charDataSelector = '#mw-content-text > aside';

const scrapeCharLinks = async() => {
  const html = await request.get(`${fandomURL}/wiki/Villager_list_(New_Horizons)`).retry(3);
  const $ = cheerio.load(html.text);

  const characterLinkArray = [];

  $(charLinkSelector).each((_, element) => $(element).find('tr').each((_, element) => {
    const charLink = $(element).find('a').attr('href');

    if(charLink){
      characterLinkArray.push(`${fandomURL}${charLink}`);
    }
  }));

  return characterLinkArray.slice(1, characterLinkArray.length);
};

const scrapeCharacterData = async(url) => {
  const { text } = await request.get(url).retry(3);
  const $ = (args) => cheerio.load(text)(charDataSelector).find(args); 
    
  const brewCoffee = () => {
    const [roast, milk, sugar] = $('div[data-source="Coffee"] > div').text().replace(/([”“])/g, '').split(',');
    return { roast, milk, sugar };
  };

  const writeSong = () => {
    const song = $('div[data-source="Song"] > div > a');
    return { name: song.text(), link: `${fandomURL}${song.attr('href')}` };
  };
  
  return {
    url,
    name: $('h2[data-source="name"]').text(),
    japaneseName: $('h2[data-source="jname"]').text(),
    image: $('figure > a').attr('href'),
    quote: $('figure > figcaption').text().replace(/([”“])/g, ''),
    gender: $('div[data-source="Gender"] > div').text(),
    personality: $('div[data-source="Personality"] > div').text(),
    species: $('div[data-source="Species"] > div').text(),
    birthday: $('div[data-source="Birthday"] > div').text(),
    phrase: $('section > div > div').text().split('<')[0].trim(),
    skill: $('section > div[data-source="Skill"] > div').text(),
    goal: $('section > div[data-source="Goal"] > div').text(),
    coffee: brewCoffee(),
    song: writeSong(),
    gameAppearances: $('div[data-source="Games"] > div').text().split(',').map(item => item.trim()),
    style: $('div[data-source="Style"] > div').text() ? $('div[data-source="Style"] > div').text() : 'n/a'
  };
};

const scrapeAllCharacters = () => {
  return scrapeCharLinks()
    .then(charLinks => Promise.all(charLinks.map(url => scrapeCharacterData(url))));
};

module.exports = {
  scrapeCharacterData,
  scrapeAllCharacters
};