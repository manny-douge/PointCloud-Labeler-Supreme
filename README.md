# PointCloud Labeler Supreme
![PC Labeler](usage.gif)

PLS is a lightweight, browser-based, ThreeJS powered PointCloud Labeler.

# Current Features:

  - Import single pointcloud for labeling as JSON.
  - Import multiple pointclouds into as a sequence.
  - Abililty to playback sequences.
  - Export of data in user-specified form as JSON.

### Todos
 - Add support for import of more standard pointcloud file formats.
 - Add hooks for customized import and exports.

# Instructions/Controls:

Controls for VIEWING mode:
| Control| Purpose|
| ------ | ------ |
| Left-click | Rotate around scene when in VIEWING mode |
| Right-click | Pan around scene when in VIEWING mode |
| Space| Toggle between VIEWING mode and LABELING mode, camera controls are diasbled in LABELING mode|

Controls for LABELING mode:
| Control| Purpose|
| ------ | ------ |
| Left-click | Clicking and dragging creates a selection box which will select points once mouse is released.|
| Right-click | Pan is disabled in LABELING mode. |
| Space| Toggle between VIEWING mode and LABELING mode, camera controls are diasbled in LABELING mode|


# Installation and libraries 

#### Running locally

Pull down the repo and utilize your tool of choice to serve the repository.
For convenience a one liner script is provided using Python3 to serve the directory.


```sh
chmod +x serve.sh
./serve.sh
```

Verify the deployment by navigating to your server address in your preferred browser.

```sh
localhost:8000
```

PLS uses a number of open source projects to work properly:

| Project | Purpose |
| ------ | ------ |
| ThreeJS | Lightweight JavaScript 3D library|
| OrbitControls | Camera tool provided separately as a small part of ThreeJS |
| DAT.GUI | A lightweight graphical user interface for changing variables in JavaScript. |

# Notes on file formats, importing, and exporting
#### Importing data

This project expects a JSON file for import. The format of the JSON file should be a list of lists, where each sublist within the overarching list describes a sequence of points (pointcloud).

Where each sequence of points is expected to be as follows:
row 1 example: x1, y1, z1, x2, y2, z2, x3, y3, z3, xn, yn, zn, ...

An example JSON is included below of a pointcloud sequence with 3 lists, each row denoting a different
pointcloud, each pointcloud having only 4 points(with comments).

```
[   //Overarching list
    [1, 42, 52, 231, 53, 12, 90, 21, 42, 900, 32, 151],         //First pointcloud
    [90, 96, 30, 96,  3, 21, 48, 97, 66, 63, 41, 13],         //Second pointcloud
    [56, 87, 38, 79, 74, 41, 31, 63, 96, 96, 67, 12],         //Third pointcloud
] //End list of lists
```
3 attributes for each point (x,y,z) * 4 points in each cloud = 12 points per list
Examples of varying sizes up to 30,000 points and varying numbers of rows is included in the 
examples folder.

| Example | Description |
| ------ | ------ |
| 10.json | ~28k points per row, for 10 rows (pointclouds) |
| 20.json | ~28k points per row, for 20 rows (pointclouds) |
| 30.json | ~28k points per row, for 30 rows (pointclouds) |

#### Exporting data for unary classification

Once labeling is complete, data can be exported with the "Export JSON" option in the GUI.
For now, a JSON file is exported as a list of 0's and 1's.

1 indicating that some object that you are labeling exists within this fame.
0 indicating that object does not exist in this frame.

This method of labeling is useful for unary classification (often called class modeling), where your learning primarily learning consists of a training set of objects only of this specific class
to discover an accurate method to detect said class.

Unary classification is most often used for outlier detection, anomaly detection, and novelty detection.

#### Exporting data in your own way

If you wish to export data in your own way whilst using this labeler.

Within the DataManager module exists a function:
```
function package_data() { .... }
```

This can be overridden to export data existing with the scene using the labeled data exported from the pointcloud scene.


| Example | Description |
| ------ | ------ |
| 10.json | ~28k points per row, for 10 rows (pointclouds) |
| 20.json | ~28k points per row, for 20 rows (pointclouds) |
| 30.json | ~28k points per row, for 30 rows (pointclouds) |


# Utilities for creating pointclouds from ROS

As this project was intended to harvest points from a bag file produced on the ROS platform,
from a LiDar sensor.

Included in this repo are a few utilities to make that easier.

| file | Description |
| ------ | ------ |
| bag2csv.py| Script that converts bag files to CSVs, with credit to Nick Speal and Marc Hanaheide |.
| csvToJSON.py | Script that converts specifically the pointcloud points to the format readable for this application, with credit Dr. Dylan Schwesinger|  


License
----

MIT

