export default async function* report(events) {
  let coverage = null
  let tests = null
  for await (const event of events) {
    if (event.type === 'test:coverage') coverage = event.data.summary
    if (event.type === 'test:summary' && event.data.file == null) tests = event.data
    if (event.type === 'test:fail') console.error(event.data.name, event.data.details?.error ?? '')
  }
  yield `${JSON.stringify({ coverage, tests }, null, 2)}\n`
}
