#!/bin/sh

pnpm hasura:generate -y
pnpm hasura:apply
pnpm migration:generate
pnpm migration:apply
