import * as Chescarna from '../demonia/chescarna.js';

const component = Chescarna.mountElement(
    'app',
    [{
        columns: [ 'c1', 'c2', 'c3', 'c4' ],
        rows: [
            [ 'a', 'b', 'c', 'd' ],
            [ '1', '2', '3', '4' ],
            [ 'A', 'B', 'C', 'D' ],
            [ 'X', 'Y', 'Z', 'W' ],
        ],
        cellClass: 'cell-class',
    }]
);

Chescarna.update(component);
