import {
  isJSXExpressionContainer,
  isStringLiteral,
  jSXExpressionContainer,
  jSXIdentifier,
} from '@babel/types'
import babelPluginJsxSyntax from '@babel/plugin-syntax-jsx'
import path from 'path'
import md5 from 'md5'
import getClassName from './getClassName'

const getFilenameFromPath = filePath => {
  const parts = filePath.split('/')
  return parts[parts.length - 1].split('?')[0]
}

const forPlugin = (sourcePath, stats) => {
  let { includeRegExp, exclude = [] } = stats.opts
  if (!includeRegExp) {
    includeRegExp = /\.(sa|sc|c)ss$/
  }
  if (exclude.some(p => stats.file.opts.filename.startsWith(path.join(process.cwd(), p)))) {
    return false
  }
  const filename = getFilenameFromPath(sourcePath.node.source.value)
  return filename.match(new RegExp(includeRegExp))
}

export default function ({ types: t }) {
  const computedHash = {}
  const importedHelperIndentifier = {}
  const suffixIdentifier = {}
  const suffixMap = {}
  let lastHash = ''

  const setupFile = (path, filename) => {
    const programPath = path.findParent(parentPath => {
      return parentPath.isProgram()
    })

    importedHelperIndentifier[filename] = programPath.scope.generateUidIdentifier('getClassName')
    suffixIdentifier[filename] = programPath.scope.generateUidIdentifier('suffix')

    programPath.unshiftContainer(
      'body',
      t.importDeclaration(
        [t.importDefaultSpecifier(importedHelperIndentifier[filename])],
        t.stringLiteral('babel-plugin-react-css-modules-file/dist/browser/getClassName')
      )
    )

    const firstNonImportDeclarationNode = programPath.get('body').find(node => {
      return !t.isImportDeclaration(node)
    })

    firstNonImportDeclarationNode.insertBefore(
      t.variableDeclaration('const', [
        t.variableDeclarator(suffixIdentifier[filename], t.stringLiteral(suffixMap[filename])),
      ])
    )
  }

  const addWebpackHotModuleAccept = path => {
    const test = t.memberExpression(t.identifier('module'), t.identifier('hot'))
    const consequent = t.blockStatement([
      t.expressionStatement(
        t.callExpression(
          t.memberExpression(
            t.memberExpression(t.identifier('module'), t.identifier('hot')),
            t.identifier('accept')
          ),
          [
            t.stringLiteral(path.node.source.value),
            t.functionExpression(
              null,
              [],
              t.blockStatement([
                t.expressionStatement(
                  t.callExpression(t.identifier('require'), [
                    t.stringLiteral(path.node.source.value),
                  ])
                ),
              ])
            ),
          ]
        )
      ),
    ])

    const programPath = path.findParent(parentPath => {
      return parentPath.isProgram()
    })

    const firstNonImportDeclarationNode = programPath.get('body').find(node => {
      return !t.isImportDeclaration(node)
    })

    const hotAcceptStatement = t.ifStatement(test, consequent)

    if (firstNonImportDeclarationNode) {
      firstNonImportDeclarationNode.insertBefore(hotAcceptStatement)
    } else {
      programPath.pushContainer('body', hotAcceptStatement)
    }
  }

  const computeHash = (hashSeed = '', filePath) => {
    if (computedHash[filePath]) {
      return computedHash[filePath]
    }

    const relative = path.relative(process.cwd(), filePath)
    const hash = md5(hashSeed + relative + lastHash).substr(0, 8)
    computedHash[filePath] = hash
    lastHash = hash
    return hash
  }

  return {
    inherits: babelPluginJsxSyntax,
    pre() {
      this.hasScopedCss = false
    },
    visitor: {
      ImportDeclaration(path, stats) {
        if (!forPlugin(path, stats)) {
          return
        }
        this.hasScopedCss = true
        const filename = stats.file.opts.filename
        const { hashSeed } = stats.opts
        const hash = computeHash(hashSeed, filename)
        path.node.source.value = `${path.node.source.value}?scopeId=${hash}`
        suffixMap[filename] = hash

        // TODO: 不知道为什么不顶用
        addWebpackHotModuleAccept(path)
      },
      JSXElement(path, stats) {
        if (!this.hasScopedCss || path.node.openingElement.name.type === 'JSXMemberExpression') {
          return
        }

        const filename = stats.file.opts.filename
        const { hashSeed } = stats.opts
        const hash = computeHash(hashSeed, filename)
        const suffix = `___${hash}`

        const attributes = path.node.openingElement.attributes.filter(
          attribute => typeof attribute.name === 'object' && attribute.name.name === 'className'
        )
        const destinationAttribute = path.node.openingElement.attributes.find(
          attribute => typeof attribute.name === 'object' && attribute.name.name === 'className'
        )

        for (const attribute of attributes) {
          if (isStringLiteral(attribute.value)) {
            path.node.openingElement.attributes.push(
              t.jSXAttribute(
                jSXIdentifier('className'),
                t.stringLiteral(getClassName(attribute.value.value, suffix))
              )
            )
          } else if (isJSXExpressionContainer(attribute.value)) {
            if (!isJSXExpressionContainer(destinationAttribute.value)) {
              throw new Error(`Unexpected attribute value:: ${destinationAttribute.value}`)
            }
            // if (!importedHelperIndentifier[filename]) {
            //   setupFile(path, filename)
            // }
            setupFile(path, filename)
            path.node.openingElement.attributes.push(
              t.jSXAttribute(
                jSXIdentifier('className'),
                jSXExpressionContainer(
                  t.callExpression(t.clone(importedHelperIndentifier[filename]), [
                    attribute.value.expression,
                    suffixIdentifier[filename],
                  ])
                )
              )
            )
          }
        }
      },
    },
  }
}
