/** Illustrative creator content. Existing saved edits survive the v1 upgrade. */
const variedSamples = () => ({
  'about-work': { id:'about-work',type:'text',title:'Ideas, made tangible.',description:'Thoughtful digital experiences, from the first sketch to the final detail.',visible:true },
  'creative-film': { id:'creative-film',type:'video',title:'A little creative inspiration',url:'https://www.youtube.com/watch?v=aqz-KE-bpKQ',description:'Big Buck Bunny · Blender Foundation',visible:true },
  'studio-gallery': { id:'studio-gallery',type:'gallery',title:'From the studio',images:['/assets/illustrations/studio-blue.svg','/assets/illustrations/studio-coral.svg','/assets/illustrations/studio-lilac.svg'],description:'A few explorations in form, color, and identity.',visible:true },
  'quick-answers': { id:'quick-answers',type:'dropdown',title:'Good to know',items:[{question:'What can we work on together?',answer:'Product design, brand identities, and thoughtful websites. Tell me what you have in mind.'},{question:'Are you open to new projects?',answer:'Yes, I’m open to a few new collaborations. Send a little about your project and timeline.'}],visible:true },
  'say-hello': { id:'say-hello',type:'email',title:'Let’s make something great',email:'hello@example.com',subject:'Let’s work together',visible:true }
});

export function initialPage({varied=true} = {}) {
  const page = {
    version: 2,
    profile: { name: 'Vahri Maulana', bio: 'Product designer. Making ideas work.', initials: 'VM', slug: 'vahri' },
    rootIds: ['portfolio', 'brand-identity', 'latest-projects', 'book-a-call'],
    blocks: {
      portfolio: { id: 'portfolio', type: 'collection', title: 'Portfolio', children: ['case-studies'], layout: 'stack', showTitle: true, visible: true },
      'case-studies': { id: 'case-studies', type: 'link', title: 'Case studies', url: 'https://vahrimaulana.design', description: '', visible: true },
      'brand-identity': { id: 'brand-identity', type: 'link', title: 'Brand identity', url: 'https://behance.net/vahri', description: '', visible: true },
      'latest-projects': { id: 'latest-projects', type: 'link', title: 'Latest projects', url: 'https://dribbble.com/vahri', description: '', visible: true },
      'book-a-call': { id: 'book-a-call', type: 'link', title: 'Book a call', url: 'https://calendly.com/vahri', description: '', visible: true }
    }
  };
  if(!varied) return page;
  page.blocks={...page.blocks,...variedSamples()};
  page.blocks['brand-identity']={...page.blocks['brand-identity'],display:'cover',image:'/assets/illustrations/studio-blue.svg',description:'A selection of identities, built with intention.'};
  page.rootIds=['portfolio','about-work','creative-film','brand-identity','studio-gallery','latest-projects','quick-answers','book-a-call','say-hello'];
  return page;
}

export function migratePage(page) {
  if(!page || page.version!==1) return page;
  const blocks={...page.blocks}, additions=[];
  for(const [id,block] of Object.entries(variedSamples())) if(!blocks[id]) { blocks[id]=block; additions.push(id); }
  // Keep every original block, its order, grouping, title and settings.
  const rootIds=[...page.rootIds],position=rootIds.findIndex(id=>blocks[id]?.type!=='collection');
  rootIds.splice(position<0?rootIds.length:position,0,...additions.slice(0,2));
  rootIds.push(...additions.slice(2));
  return {...page,version:2,rootIds,blocks};
}
