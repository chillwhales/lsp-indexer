#!/bin/sh

pnpm hasura:generate
pnpm hasura:apply
pnpm migration:generate
pnpm migration:apply
