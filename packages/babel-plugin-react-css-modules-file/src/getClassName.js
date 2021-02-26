export default (classNameValue: string, suffix: string): string => {
  if (!classNameValue) {
    return ''
  }
  return classNameValue
    .split(' ')
    .filter(className => className.trim())
    .map(className => `${className.trim()}___${suffix}`)
    .join(' ')
}
