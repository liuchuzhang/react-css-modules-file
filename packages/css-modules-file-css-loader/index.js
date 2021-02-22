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
          // 跳过 [:]?:deep or [:]?:global, 示例:
          // :deep .class-name { }
          // ::global .class-name { }
          if (
            (n.type === 'pseudo' && [':deep', '::deep', ':global', '::global'].includes(n.value)) ||
            (n.type === 'combinator' && n.value === '/deep/')
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
            n.value = `${n.value}__${id}`
          }
        })

        // page 选择器后面添加 body 选择器
        if (pageSelector) {
          selector.insertAfter(
            pageSelector,
            selectorParser.tag({
              value: ',body',
            })
          )
        }
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
