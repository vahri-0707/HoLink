// Desktop Bridge patch for the existing HoLink library; safe to repeat.
// Keeps component instances, Auto Layout, and existing variable bindings intact.
await figma.loadAllPagesAsync();
const variables = await figma.variables.getLocalVariablesAsync();
const variable = name => {
  const found = variables.find(value => value.name === name);
  if (!found) throw new Error(`Missing token: ${name}`);
  return found;
};
const collectionSet = figma.root.findOne(node => node.type === 'COMPONENT_SET' && node.name === 'CollectionCard');
const blockSet = figma.root.findOne(node => node.type === 'COMPONENT_SET' && node.name === 'BlockRow');
const candidateSet = figma.root.findOne(node => node.type === 'COMPONENT_SET' && node.name === 'CandidateRow');
if (!collectionSet || !blockSet || !candidateSet) throw new Error('Expected the existing HoLink component library.');
for (const card of collectionSet.children) {
  card.setBoundVariable('cornerRadius', variable('radius/16'));
  card.setBoundVariable('itemSpacing', variable('space/8'));
  const list = card.children.find(node => node.name === 'Collection children');
  list.setBoundVariable('paddingLeft', variable('space/0'));
  list.setBoundVariable('paddingRight', variable('space/0'));
  list.setBoundVariable('itemSpacing', variable('space/8'));
  for (const row of list.children) row.layoutSizingHorizontal = 'FILL';
  card.children.find(node => node.name === 'Add to Collection').setBoundVariable('cornerRadius', variable('radius/8'));
}
for (const row of blockSet.children) {
  if (row.name === 'State=Nested') row.setBoundVariable('cornerRadius', variable('radius/8'));
  row.children.find(node => node.name === 'Icon / grip-vertical')?.resize(16, 16);
  const actions = row.children.find(node => node.name === 'Block actions');
  actions?.children.find(node => node.type === 'INSTANCE')?.resize(16, 16);
}
for (const candidate of candidateSet.children) {
  const tile = candidate.children.find(node => node.name === 'Block type');
  tile?.children.find(node => node.type === 'INSTANCE')?.resize(20, 20);
}
return {
  updatedSets: [collectionSet.id, blockSet.id, candidateSet.id],
  layout: 'Collection rows and Add button share full container width; 8 px gaps and inset.'
};
