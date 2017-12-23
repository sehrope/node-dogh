import main from 'async-main';
import LineReader from 'dogh';

main(async () => {
    // Create a LineReader wrapping stdin
    const lr = new LineReader(process.stdin);

    let line;

    // Read lines until we get to the end of input
    while ((line = await lr.readLine()) != null) {
        // Do async stuff with line here
    }
});
