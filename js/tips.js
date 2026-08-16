export const EFFICIENCY_POINTS = [
  {
    title: 'Name the columns you need',
    detail: '{SELECT *} pulls every column, even the ones you ignore. Selecting only the columns you want means less data read and moved.',
  },
  {
    title: 'Cap how many rows come back',
    detail: '{LIMIT} stops the database returning thousands of rows when you only need the first few.',
  },
  {
    title: 'Only sort and group when you need to',
    detail: "{ORDER BY} and {GROUP BY} make the database organize the whole result set. If the order isn't important, leave them out.",
  },
  {
    title: 'Keep functions off the columns you filter',
    detail: 'A filter like {YEAR(example_column)} has to be worked out for every single row before the filter can run, so the index on that column goes unused.',
  },
  {
    title: 'Keep arithmetic off the columns you filter',
    detail: 'Arithmetic like {total * 2 > 100} is recalculated for every single row. Move the math to the other side and compare the bare column instead.',
  },
  {
    title: 'Filter rows with WHERE instead of HAVING',
    detail: '{WHERE} runs before grouping, so it gets rid of unnecessary rows early. {HAVING} runs after the grouping, once the work is already done.',
  },
  {
    title: 'Use EXISTS to check if something is there',
    detail: '{EXISTS} stops at the first match it finds. {IN} and {COUNT(*)} build the whole result set first, even though you only wanted a yes or no.',
  },
  {
    title: "Say what you want, not what you don't want",
    detail: 'Conditions like {=} and {BETWEEN} let the database jump straight to the rows. {NOT IN} and {!=} force it to check every row to find the ones left over.',
  },
];

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text != null) node.textContent = text;
  return node;
}

export function codeText(text) {
  const node = el('p', 'guide-list__detail');
  text.split(/(\{[^}]+\})/).forEach((part) => {
    if (part.startsWith('{') && part.endsWith('}')) {
      node.appendChild(el('code', 'guide-list__code', part.slice(1, -1)));
    } else if (part) {
      node.appendChild(document.createTextNode(part));
    }
  });
  return node;
}

export function renderTipsList() {
  const list = el('ol', 'guide-list');
  list.style.gridTemplateRows = `repeat(${Math.ceil(EFFICIENCY_POINTS.length / 2)}, auto)`;
  EFFICIENCY_POINTS.forEach((point) => {
    const item = el('li');
    item.appendChild(el('h3', 'guide-list__title', point.title));
    item.appendChild(codeText(point.detail));
    list.appendChild(item);
  });
  return list;
}