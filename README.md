# DREAM – Dynamic Memory Framework for Human-Like Memory in LLM-Based Conversational Agents

<p align="center">
  <strong>Memory That Learns. Reflects. Evolves.</strong>
</p>

DREAM is an intelligent memory framework designed to improve how Large Language Model (LLM)-based conversational agents manage and retain information over time. Inspired by human memory mechanisms, DREAM introduces memory extraction, importance evaluation, storage, retrieval, reflection, consolidation, and adaptive forgetting.

The framework aims to help AI assistants maintain meaningful long-term memories, reduce unnecessary information, and provide more context-aware responses across conversations.

## 🎯 Project Objectives

- Develop a dynamic memory management framework for LLM-based conversational agents.
- Extract meaningful information from conversations.
- Evaluate the importance of extracted memories.
- Organize and retrieve relevant information efficiently.
- Implement memory consolidation through a Dreaming Phase.
- Support adaptive forgetting of less relevant information.

## ✨ Key Features

- **Memory Extraction:** Identifies meaningful information from conversational interactions.
- **Importance Scoring:** Evaluates the significance of extracted memories.
- **Memory Classification:** Categorizes information for appropriate memory handling.
- **Memory Storage:** Maintains conversational memories using a vector database.
- **Contextual Retrieval:** Retrieves relevant memories to support responses.
- **Dreaming Phase:** Supports reflection and consolidation of stored memories.
- **Adaptive Forgetting:** Aims to manage outdated or less relevant information.

## 🔄 DREAM Workflow

```text
       User Conversation
               |
               v
       Memory Extraction
               |
               v
       Importance Scoring
               |
               v
       Memory Classification
               |
        +------+------+
        |      |      |
      STORE  REVIEW  IGNORE
        |
        v
    Memory Storage
        |
        v
  Contextual Retrieval
        |
        v
   LLM-Based Response
        |
        v
    Dreaming Phase
        |
   +----+----+
   |    |    |
Reflect Consolidate Forget
   |    |    |
   +----+----+
        |
        v
  Updated Memory System
```

## 🧠 Dreaming Phase

The Dreaming Phase is an important component of DREAM. It is designed to improve long-term memory management through:

- **Reflection:** Revisiting stored memories to identify meaningful information.
- **Consolidation:** Organizing and strengthening related memories.
- **Adaptive Forgetting:** Managing information that is outdated or less useful.

These mechanisms are inspired by human memory consolidation and forgetting processes.

## 🛠️ Technology Stack

| Component | Technology |
|---|---|
| Programming Language | Python |
| Language Model | Llama 3.1 |
| Local LLM Runtime | Ollama |
| Vector Database | ChromaDB |
| Frontend | React.js |
| Frontend Build Tool | Vite |

## ⚙️ Installation and Setup

### Prerequisites

- Python
- Node.js and npm
- Ollama
- Git

### 1. Clone the Repository

```bash
git clone <YOUR_GITHUB_REPOSITORY_URL>
cd AI-DREAM
```

### 2. Set Up the Python Environment

```bash
python3 -m venv venv
source venv/bin/activate
```

Install the project dependencies:

```bash
pip install -r requirements.txt
```

### 3. Set Up Ollama

Install Ollama and download the Llama 3.1 model:

```bash
ollama pull llama3.1
```

Start the Ollama service if it is not already running.

### 4. Set Up the Frontend

Navigate to the frontend directory:

```bash
cd dream_frontend
```

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

### 5. Run the Backend

Activate the Python environment and start the backend using the entry point configured in the project.

**Note:** Use the actual backend startup command and configuration provided by your project.

## 📊 Research and Evaluation

DREAM is evaluated using the LoCoMo conversational memory benchmark.

An experimental evaluation was conducted using 138 questions from the LoCoMo dataset.

| Experiment | Correct Answers | Accuracy |
|---|---:|---:|
| Baseline | 5 / 138 | 3.62% |
| Speaker/Time Attribution | 10 / 138 | 7.25% |
| Attribution + Importance Scoring | 12 / 138 | 8.70% |
| Consolidation Persistence Improvement | 15 / 138 | 10.87% |
| Retrieval with k = 6 | 10 / 138 | 7.25% |

**Best observed experimental result:** 10.87% (15 out of 138 questions).

These are experimental development results, not a claim of final benchmark performance. Further improvements and evaluation are ongoing.

## 📸 Project Screenshots

Screenshots of the DREAM landing page, memory dashboard, memory management, and Dreaming Phase will be added here.

## 🚀 Future Enhancements

- Improve long-term conversational memory accuracy.
- Enhance memory retrieval and ranking mechanisms.
- Optimize memory consolidation and adaptive forgetting.
- Conduct broader benchmark evaluations.
- Improve scalability and response efficiency.

## 👨‍💻 Project

**DREAM – Dynamic Memory Framework for Human-Like Memory Consolidation and Forgetting in LLM-Based Conversational Agents**

Developed as an academic project in Artificial Intelligence and Data Science.

---

<p align="center">
  <strong>DREAM – Building AI Assistants That Remember, Reflect, and Evolve.</strong>
</p>
