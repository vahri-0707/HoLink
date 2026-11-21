/** A focused, working subset of the block catalogue observed in HoLink. */
export const BLOCK_TYPES = Object.freeze({
  link: { label:'Links', singular:'Link', category:'Link', icon:'link', description:'Send people to your work, website, or next big idea.', displays:['classic','cover','showcase'], fields:[['title','Title'],['url','Link','url'],['description','Description (optional)','textarea']] },
  qr: { label:'QR Code', singular:'QR Code', category:'Link', icon:'qr-code', description:'A scannable shortcut to a website or your HoLink page.', fields:[['title','Title'],['url','Destination URL','url']] },
  text: { label:'Title & Description', singular:'Title & Description', category:'Content', icon:'text', description:'Give your page a little context with a heading and a short introduction.', fields:[['title','Title'],['description','Description','textarea']] },
  dropdown: { label:'Dropdown', singular:'Dropdown', category:'Content', icon:'list', description:'Keep answers and extra details neatly tucked away.', fields:[['title','Title']] },
  separator: { label:'Content Separator', singular:'Content Separator', category:'Content', icon:'separator', description:'Create a little breathing room between sections.', fields:[['title','Label'],['style','Separator style','separator-style']] },
  gallery: { label:'Image Slider', singular:'Image Slider', category:'Media', icon:'image', description:'Let your audience browse a few highlights of your work.', fields:[['title','Title'],['images','Image URLs · one per line','images'],['description','Caption (optional)','textarea']] },
  music: { label:'Music', singular:'Music', category:'Media', icon:'music', description:'Share a track with an audio player your audience can use.', fields:[['title','Track title'],['artist','Artist'],['url','Audio file URL','audio']] },
  podcast: { label:'Apple Podcast', singular:'Apple Podcast', category:'Media', icon:'podcast', description:'Give your latest episode a place on your page.', fields:[['title','Episode title'],['artist','Podcast name'],['url','Apple Podcasts URL','url'],['description','Description (optional)','textarea']] },
  pdf: { label:'PDF', singular:'PDF', category:'Media', icon:'file', description:'Share a portfolio, media kit, or useful document.', fields:[['title','Title'],['url','PDF URL','url'],['description','Description (optional)','textarea']] },
  video: { label:'YouTube Video', singular:'YouTube Video', category:'Social', icon:'video', description:'Show your latest video, ready to watch right on your page.', fields:[['title','Video title'],['url','YouTube URL','youtube'],['description','Description (optional)','textarea']] },
  calendly: { label:'Calendly Booking', singular:'Calendly Booking', category:'Business', icon:'calendar', description:'Make it easy to find a time and book a conversation.', fields:[['title','Title'],['url','Calendly URL','url'],['description','Description (optional)','textarea']] },
  email: { label:'Email', singular:'Email', category:'Contact', icon:'mail', description:'Start a conversation with one tap.', fields:[['title','Button label'],['email','Email address','email'],['subject','Email subject (optional)']] },
  phone: { label:'Phone', singular:'Phone', category:'Contact', icon:'phone', description:'Give your audience a direct way to call you.', fields:[['title','Button label'],['phone','Phone number · include country code','tel']] },
  whatsapp: { label:'WhatsApp', singular:'WhatsApp', category:'Contact', icon:'whatsapp', description:'Open a chat with a message ready to send.', fields:[['title','Button label'],['phone','Phone number · include country code','tel'],['message','Prefilled message (optional)','textarea']] },
  location: { label:'Location', singular:'Location', category:'Contact', icon:'location', description:'Help people find your studio, shop, or next event.', fields:[['title','Place name'],['address','Address','textarea']] }
});

export const BLOCK_CATEGORIES = ['Link','Content','Media','Social','Business','Contact'];
export const blockMeta = block => BLOCK_TYPES[typeof block === 'string' ? block : block.type];
export const isContentBlock = block => !!block && !!BLOCK_TYPES[block.type];
export const blockLabel = block => blockMeta(block)?.singular || 'Collection';
export const blockIcon = block => blockMeta(block)?.icon || 'folder';
export const displayLabel = value => ({classic:'Classic',cover:'Cover',showcase:'Showcase'})[value] || 'Classic';

export function draftForType(type, pageUrl = '') {
  const draft = Object.fromEntries((BLOCK_TYPES[type]?.fields || []).map(([key]) => [key,'']));
  draft.title = ({link:'',qr:'Scan to connect',text:'A little about me',dropdown:'Good to know',separator:'Explore more',gallery:'Selected work',music:'A little inspiration',podcast:'My latest episode',video:'Watch my latest video',pdf:'My portfolio',calendly:'Book a call',email:'Let’s talk',phone:'Give me a call',whatsapp:'Chat on WhatsApp',location:'Visit my studio'})[type] || '';
  if(type === 'qr') draft.url = pageUrl;
  if(type === 'link') { draft.display='classic'; draft.image='/assets/illustrations/studio-blue.svg'; }
  if(type === 'separator') draft.style='line';
  if(type === 'dropdown') draft.items=[{question:'What would you like to know?',answer:''}];
  if(type === 'gallery') draft.images=[];
  return draft;
}

export function youtubeId(input) {
  try {
    const url=new URL(input);
    let id;
    if(url.hostname==='youtu.be') id=url.pathname.slice(1).split('/')[0];
    else if(['youtube.com','www.youtube.com','m.youtube.com','www.youtube-nocookie.com'].includes(url.hostname)) id=url.searchParams.get('v') || url.pathname.match(/^\/(?:embed|shorts)\/([^/]+)/)?.[1];
    return /^[A-Za-z0-9_-]{11}$/.test(id || '') ? id : null;
  } catch { return null; }
}
