# Source-review architecture

The academy backend no longer mirrors the public learning site. Agents read
`yogesh660/ml-model-zoo` through the read-only GitHub adapter, collect a pinned
source revision, compare the proposed lesson with a relevant existing model
page, and produce evidence before the proposal boundary is reached.

```text
remote source -> read-only adapter -> evidence bundle -> agent review chain
                                      |                  |
                                      +-> QA gate -------+-> Principal approval
                                                         |
                                                         +-> feature branch PR only
```

The source repository remains authoritative for curriculum, generated pages,
assets, datasets, and deployment. `learning-institute` stores only governance,
task state, evidence metadata, and security controls.

## Required review stages

1. Read source instructions and pin the source commit.
2. Select the closest model/lesson template and produce a section matrix.
3. Review architecture, walkthrough, labs, code, metadata, links, and claims.
4. Run source-repository build and visual/interaction QA on the feature branch.
5. Record gaps and human-review requirements.
6. Require Principal approval before opening a pull request; never merge it.
