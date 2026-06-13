#!/bin/sh
concurrently "node dist/index.js" "sonata"
