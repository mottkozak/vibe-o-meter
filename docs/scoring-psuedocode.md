Initialize scores for all 10 axes to 0.

For each answered question:
  for each axisKey in answer.delta:
    scores[axisKey] += answer.delta[axisKey]

Compute each compass position:
  power: x=VW, y=HG
  order: x=KP, y=RJ
  discipline: x=SC, y=ST
  social: x=PT, y=QR
  risk: x=GP, y=MA

Assign compass quadrant labels by sign.

Compute 64-type code from 6 axes:
  VW HG KP RJ SC MA -> letters

Get family = first two letters
Get index from KP RJ SC MA bits
Title = families[family].titles16[index]

Render results with:
- Type title + code
- 5 quadrant labels
- 5 charts with x/y positions
- A write-up assembled from quadrantWriteups + type template