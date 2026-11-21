import test from 'node:test';
import assert from 'node:assert/strict';
import { initialPage as seedPage } from '../src/data.js';
import { History, moveBlocks, eligibleBlocks, addCollection, addLink, updateBlock, assertPage, normalizeUrl, reorderBlock, removeBlock } from '../src/model.js';

// Keep the original Collection scenarios small; mixed blocks have dedicated tests.
const initialPage=()=>seedPage({varied:false});

test('moving preserves document order, link data, and exactly one location for every block', () => {
  const before = initialPage();
  const after = moveBlocks(before, ['latest-projects', 'brand-identity'], 'portfolio');
  assert.deepEqual(after.blocks.portfolio.children, ['case-studies', 'brand-identity', 'latest-projects']);
  assert.deepEqual(after.rootIds, ['portfolio', 'book-a-call']);
  assert.deepEqual(after.blocks['brand-identity'], before.blocks['brand-identity']);
  assert.deepEqual(before.blocks.portfolio.children, ['case-studies']);
  assert.equal(assertPage(after), after);
});

test('selection can include hidden search results and duplicate IDs without duplicating blocks', () => {
  const page = initialPage();
  assert.deepEqual(eligibleBlocks(page, 'portfolio', 'DRIBBBLE').map(b => b.id), ['latest-projects']);
  const after = moveBlocks(page, ['brand-identity', 'latest-projects', 'brand-identity'], 'portfolio');
  assert.equal(after.blocks.portfolio.children.length, 3);
  assert.deepEqual(eligibleBlocks(after, 'portfolio').map(b => b.id), ['book-a-call']);
});

test('a move between Collections removes the original reference and preserves settings', () => {
  let page = addCollection(initialPage(), { id: 'favorites', title: 'Favorites' });
  page = updateBlock(page, 'case-studies', { visible: false, description: 'Custom description' });
  const after = moveBlocks(page, ['case-studies'], 'favorites');
  assert.deepEqual(after.blocks.portfolio.children, []);
  assert.deepEqual(after.blocks.favorites.children, ['case-studies']);
  assert.equal(after.blocks['case-studies'].visible, false);
  assert.equal(after.blocks['case-studies'].description, 'Custom description');
});

test('undo and redo restore exact grouping, order and metadata, including after subsequent edits', () => {
  const history = new History(), original = initialPage();
  const moved = moveBlocks(original, ['brand-identity', 'latest-projects'], 'portfolio');
  history.commit(original, moved, 'Move');
  const edited = updateBlock(moved, 'portfolio', { title: 'My work' });
  history.commit(moved, edited, 'Rename');
  const undoRename = history.undo(edited); assert.deepEqual(undoRename.page, moved);
  const undoMove = history.undo(undoRename.page); assert.deepEqual(undoMove.page, original);
  assert.deepEqual(history.redo(original).page, moved);
});

test('invalid and cyclic moves are rejected atomically; a move to the same Collection is a no-op', () => {
  const page = initialPage();
  assert.throws(() => moveBlocks(page, ['portfolio'], 'portfolio'));
  assert.throws(() => moveBlocks(page, ['unknown'], 'portfolio'));
  assert.equal(moveBlocks(page, ['case-studies'], 'portfolio'), page);
  assert.deepEqual(page, initialPage());
});

test('unsafe URLs are rejected and editing a URL preserves an existing manual title', () => {
  assert.throws(() => normalizeUrl('javascript:alert(1)'));
  assert.throws(() => normalizeUrl('data:text/html,bad'));
  assert.equal(normalizeUrl('example.com'), 'https://example.com/');
  const after = updateBlock(initialPage(), 'brand-identity', { url: 'https://example.com' });
  assert.equal(after.blocks['brand-identity'].title, 'Brand identity');
});

test('new links can be added directly to a Collection and remain valid after reorder/removal', () => {
  let page = addLink(initialPage(), { id: 'new-link', title: 'My newsletter', url: 'newsletter.example.com' }, 'portfolio');
  assert.equal(page.rootIds.includes('new-link'), false);
  page = reorderBlock(page, 'new-link', -1);
  assert.deepEqual(page.blocks.portfolio.children, ['new-link', 'case-studies']);
  page = removeBlock(page, 'new-link');
  assert.deepEqual(page.blocks.portfolio.children, ['case-studies']);
  assertPage(page);
});

test('corrupt persisted data is rejected rather than losing or duplicating content', () => {
  const page = initialPage(); page.rootIds.push('case-studies');
  assert.throws(() => assertPage(page), /more than once/);
  const orphan = initialPage(); orphan.rootIds = [];
  assert.throws(() => assertPage(orphan), /orphan/);
});
