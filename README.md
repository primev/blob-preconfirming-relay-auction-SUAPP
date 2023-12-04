# Build a SUAPP Template

This repo will help you get started building a SUAPP with a modern frontend.

## Get Started

First, you need to build [`suave-viem`](https://github.com/flashbots/suave-viem) yourself. Clone that repo and then use `bun` to do the following:

```bash
$ cd suave-viem
$ bun install
$ bun run build
$ bun link
```

Now, clone this repo and install its dependencies (one of which is the `suave-viem` package we just built).

**We recommend using node v20.10.0 and npm v10.2.3**:

```bash
$ cd build-a-suapp
$ git submodule init # to initalize the forge-std lib
$ git submodule update
$ yarn
$ cd packages/next && bun link viem
```

You should now be able to compile (and deploy) your contracts with:

```bash
$ yarn contracts:build 
```

```bash
yarn contracts:deploy # will deploy whatever contracts you tell it to, if you have SUAVE running locally
```

If you run into a permissions error with this, try running `chmod + x packages/forge/deploy` from the root directory.

You can start the frontend with:

```bash
yarn fe:dev
```

## Notes

1. No tests are included in `forge`, as it is not trivial to test new precompiles and different transaction types (i.e. CCRs) in Forge at this time.
2. If you want to pirate ready-to-use typescript components for your frontend, we recommend you do so from [scaffold-eth2](https://github.com/scaffold-eth/scaffold-eth-2).