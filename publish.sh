yarn build
if [ $? -eq 0 ]; then
    pushd packages/bun/build
    npm publish
    popd
    pushd packages/cfw/build
    npm publish
    popd
    pushd packages/node/build/node
    npm publish
    popd
    pushd packages/node/build/express
    npm publish
    popd
fi
