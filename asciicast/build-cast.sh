#!/bin/bash
CAST=${1}

cat ${CAST} | jq --tab . >> temp.cast
mv temp.cast ${CAST}
svg-term --in ${CAST} --height 20 --width 182 --out temp.svg --window
cat temp.svg | xmllint --format - > ${CAST}.svg
sed -i 's/f{fill:#b9c0cb}/f{fill:#00ff00}/g' ${CAST}.svg
#sed -i "s/animation-iteration-count:infinite;/animation-iteration-count:1;animation-fill-mode:forwards;/g" sddc.status.svg
