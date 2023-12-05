# NMCS-Example
Nested Monte Carlo Search: An extract from a larger project, 95% of this extract has been authored by myself. 

## Code Overview
The code is separated into classes which define the logic for the Nested Monte Carlo Search search implementation logic and specific rules required for the task at hand. This abstraction helps to separate concerns and helps with maintainability.
- The `Nmcs` class provides contains contains all the search logic for the Nested Monte Carlo Search.
- `NmcsRules` is an abstract class which defines properties and methods for appropriate pruning of actions, assigning rewards to solutions, and defining a default rollout policy.
- `NmcsState` is an abstract class which defines methods for cloning and updating states via appending an action.
- `AggNmcsRules` and `AggNmcsState` are implementations of the respective abstract classes which define appropriate logic related to the specific problem at hand.
  
## Problem Statement
The code contained within this extract relates to the fourth stage in the image below, aggregation of fixed modular apartments and cores to a predefined building skeleton.
![image](https://github.com/samgregson/NMCS-Example/assets/12054742/9e98190a-2b7c-49f1-8760-4703e119df36)

This task has the following constraints and targets:
- user defined unit mix target
- travel distances given by fire regulations
- desire to maximise NIA and residential efficiency
- an apartment cannot be placed if it blocks the door of another existing apartment
- an apartment cannot be placed if its door is blocked by an existing apartment
- even distribution travel distances to nearest core

### Ineffective Strategies
- Naively enumerating all possibilities/combinations of apartments and cores is intractable due to combinatorial explosion.
- Dynamic programming is not possible due to the combination of hard and soft constraints some of which can only be assessed with a complete aggregation (as opposed to partially complete).
- More traditional heuristic optimisation techniques (such as genetic algorithms) are sample inefficient as they do not prune obvious/calculable infeasible actions/combinations

### Solution
The way that this problem was solved was by treating the placement of a unit (apartemnt or core) as an 'action' and using a method in the class of Monte Carlo Tree Search methods to search the solution space whilst only considering valid actions at each step. Monte Carlo Tree Search scores solutions at the end state and therefore the above constraints and targets can be evaluated appropriately without approximation.

The specific method chosen was Nested Monte Carlo Search, the original paper of which can be found here: https://www.ijcai.org/Proceedings/09/Papers/083.pdf

![image](https://github.com/samgregson/NMCS-Example/assets/12054742/5474b7a5-8bca-47b8-b516-62867e16da29)
