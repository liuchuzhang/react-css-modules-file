const selectorParser = require('postcss-selector-parser')
const postcss = require('postcss')
const qs = require('qs')

const compileStyle = postcss.plugin('css-modules-file', options => root => {
  const { id } = options
  root.each(node => {
    if (!node.selector) return

    node.selector = selectorParser(selectors => {
      selectors.each(selector => {
        let pageSelector = null

        selector.each(n => {
          // ">>>" and "/deep/" combinator
          if (
            n.type === 'combinator' &&
            (n.value === '>>>' || n.value === '/deep/')
          ) {
            n.value = ' '
            n.spaces.before = n.spaces.after = ''
            return false
          }

          if (n.type === 'tag' && n.value === 'page') {
            pageSelector = n
          }

          if (n.type === 'tag') {
            return false
          }

          if (n.type === 'class') {
            n.value = `${n.value}___${id}`
          }
        })
      })
    }).processSync(node.selector)
  })
})

module.exports = function(source) {
  const resourceQuery = qs.parse(this.resource.split('?')[1])
  if (resourceQuery.scopeId) {
    return postcss([compileStyle({ id: resourceQuery.scopeId })]).process(source).css
  }
  return source
}
