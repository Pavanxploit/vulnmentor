# Case authoring template

| Field | What to supply |
| --- | --- |
| Title and path | A short case title and the course or track where it belongs |
| Learning outcome | One observable decision the learner can make after the exercise |
| Prerequisite | A lesson slug or concept learners should already know |
| Evidence | Three short synthetic audit entries and the one that violates the policy |
| Expected rule | Who may access or change which field, resource, or state |
| Fix | Three plausible controls, the best answer, and a reason |
| Regression check | An expected outcome the corrected implementation must preserve |
| Reading and accessibility | An authoritative source, descriptive image text, and captions for recorded content |

For the static demo, add one entry to `public/demo/cases.js`. The `signal` and `control` fields are zero-based indexes into the trace entries and choices. Open the case by its fragment identifier and test a wrong choice, a correct choice, navigation away and back, and the completion count.
