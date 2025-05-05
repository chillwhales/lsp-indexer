#!/bin/sh

pnpm migration:generate
pnpm migration:apply
# pnpm hasura:generate
# pnpm hasura:apply
