# Author: Dr. Dylan Schwesinger
# With amendments by: Emmanuel Douge
import csv
import json
import struct
import sys

if __name__ == '__main__':

    if len(sys.argv) != 2:
        print('Usage: <CSV file>')
        sys.exit(1)

    data = []
    with open(sys.argv[1]) as f:
        next(f)
        for line in f:
            row = line.split('[')
            row = row[-1].split(']')[0]
            ints = [int(x) for x in row.split(',')]
            data.append(bytes(ints))

    result = []
    for d in data:
        points_iter = struct.iter_unpack('ffffh', d)
        curr_row = []
        for p in points_iter:
            curr_row.extend( [ p[0], p[1], p[2] ] ) 
        result.append(curr_row)
        #result.append([p for p in points_iter])
    print( f"Total rows processed {len(result)}" )
    with open('out.json', 'w') as f:
        json.dump(result, f)
