# DREAM Evaluation Layer

This directory contains scripts and tools for evaluating the DREAM memory architecture against benchmark datasets such as LoCoMo and LongMemEval, without requiring any modifications to the existing cognitive architecture.

## Overview

The evaluation runners work by:
1. Instantiating isolated components of the DREAM pipeline (Extractor, Scorer, Decision Engine, Consolidator, Retriever, LLM).
2. Feeding the dataset's conversational history sequentially through the pipeline, exactly as it happens in a normal chat session.
3. Supplying the benchmark question to retrieve memories and generate an answer.
4. Comparing the generated answer to the dataset's ground truth.
5. Recording transparent metrics (e.g. success rate, substring matching accuracy) and saving the detailed results as JSON files.

The isolated database used for evaluation (`memory_db` in the current working directory when run) is cleared automatically between samples to prevent state-bleeding.

## Requirements

Ensure your DREAM backend dependencies are installed and the services (Ollama) are running.

## Running Evaluations

### Evaluate LoCoMo
```bash
python3 evaluation/locomo_runner.py
```
This processes all samples in `datasets/locomo/locomo_refined.json` and writes results to `evaluation/results/locomo_results.json`.

### Evaluate LongMemEval
```bash
python3 evaluation/longmemeval_runner.py
```
This processes all samples in `datasets/longmemeval/longmemeval_oracle.json` and writes results to `evaluation/results/longmemeval_results.json`.

## Metrics

The evaluation will output high-level statistics like:
*   `total_examples`: Number of benchmark items.
*   `successfully_processed`: Items that ran through the pipeline without exception.
*   `failed_examples`: Items that threw exceptions.
*   `answer_accuracy`: Simple text correctness measured by substring match between expected answers and predicted answers.
*   `avg_retrieved_memories`: The average count of memories retrieved across successful questions.
