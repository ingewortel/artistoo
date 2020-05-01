# An introduction to the CPM

This tutorial provides a brief introduction to the Cellular Potts Model (CPM)
framework. This intro is not specific to Artistoo, but aims to provide a general 
overview of how CPMs work and to give you a feel for what the parameters mean.
If you are already familiar with the CPM, this tutorial is probably not for you;
feel free to skip ahead to the more technical tutorials.

## A brief history of the CPM

The first version of a CPM was developed in the early nineties by 
Fran&ccedil;ois Graner and James Glazier [(1)](#graner-glazier). At the time,
developmental biologists had found that when two different types of embryonic 
cells were mixed, they would sort into large, homogeneous same-cell patches - 
spontaneously! Experimental studies suggested that this sorting process was 
governed by differential adhesion between the cell types.
To understand how this might work, Graner and Glazier wanted to model the
phenomenon and see if they could indeed reproduce sorting based on such
"differential adhesion" alone.

Their model was an extension of the existing *Potts model* [(2)](#basic-potts), 
originally developed by physicists to simulate magnetism. The Potts model 
simulates the interaction between so-called "spins" on a 
crystalline lattice and looks like this:

INSERTFROMFILE 0001

While the Potts model does not much look like a cell, it does have an 
interesting property: the "spins" on the lattice *automatically sort* into
large patches of same-spin sites. Graner and Glazier saw this, and realized 
that they could apply the same principle to the cell sorting problem - with 
some slight modifications. 

A problem with the Potts model is that pixels can
only have one of two states, which could be interpreted as one cell and 
background. But Graner and Glazier needed to model multiple different cells for
their differential adhesion simulation. Their model replaced the binary "spin" 
property with a "cell identity", a number indicating
the cell to which a grid point belonged. (The trick here is that in contrast to
the "spin", the cell identity number could take on more than two 
values - allowing the co-existence of multiple cells on the same grid). 

A second problem is that the patches formed in the Potts model can be of any 
size and shape, unlike cells. Graner and Glazier therefore extended the 
energy equations so that "cells" would roughly keep the 
same size (number of grid points) [(1](#graner-glazier)[,3)](#cpm-history),
and used this to model their differential adhesion hypothesis.

The result was pretty magical:

INSERTFROMFILE 0002

This was the first "cellular" Potts model, or CPM. After Graner and Glazier
showed how the central energy equation of the Potts model could be extended to 
incorporate processes relevant to cells, others quickly followed with their own 
variations to the cellular Potts model. In particular, Paulien Hogeweg developed 
important extensions to generalize the CPM - which is why it is also 
referred to as the Glazier-Graner-Hogeweg (GGH) model [(3)](#cpm-history).

## CPM: basic principle

So how does the CPM work? The basic principle is simple. We model a collection
of *pixels* on a grid, where each pixel belongs to a specific *cell*. We then
let these pixels dynamically change which cell they belong to, according to 
a set of *energy rules* that we define (which we will discuss later).

### A note on terminology

At a given point during the simulation, any single pixel always belongs to a 
single cell. We save this information in the form of integer numbers indicating 
which cell each pixel is currently part of (we call these [cell IDs](
../typedef/index.html#static-typedef-CellId) - Figure 1). Each individual cell 
on the grid thus consists of a number of pixels with the same cell ID - which is 
unique to that cell. However, some cells may be more similar to each other than 
others (for example, we may want to model a tissue of skin keratinocytes with T 
cells moving in between). We therefore also define the *types* of cells on the 
grid, but we call them by the less conventional term [cell kinds](
../typedef/index.html#static-typedef-CellKind) (Figure 1). 
This is to prevent confusion between biologists and general Potts model users, 
who classically used the word "type" for what we now call cell ID. We therefore 
avoid the word "type" whenever we can and use either cell ID or cell kind instead.

INSERTFROMFILE 0003

### Simulation algorithm

Given a grid where all pixels have some cell ID assigned to them (possibly 0), 
we can then perform a simulation as follows (Figure 2):

INSERTFROMFILE 0004

Notice that we here consider a *decrease* in energy to be a "good thing": we 
call it energetically favourable. This may feel a little unintuitive, but is 
common practice among physicists and chemists. You can think of the internal 
energy of a system as the energy it *costs* to keep the system the way it is 
now (kind of like how an object you lift up gains *potential energy*; if 
it can decrease that energy by falling to the ground, it will). If we consider 
the energy $H$ as some kind of energy *cost*, it makes more sense that a 
negative &Delta;H is considered "good".

## The Hamiltonian

Before, we have just assumed that we can calculate this energy $H$ 
somehow. We will here discuss how we come up with this magical number.

The equation we use to calculate $H$ is called the Hamiltonian. This is no 
single Hamiltonian equation; it can contain many different components depending 
on what we are trying to model. The CPM is, therefore, not a single model but
rather a model *formalism* in which many different models can be constructed. 
This flexibility in designing the Hamiltonian is one of the nice properties of 
the CPM: we can model many types of processes by adding the right terms to the 
Hamiltonian equation; we just add up all these different energy terms or 
*constraints* to get the total $H$ of the system. This section will discuss 
some energy terms you may find interesting - but you'll find many more in 
literature.

### Adhesion

The most classical component of the Hamiltonian is the *adhesion* equation, 
which made up the entire Hamiltonian in the original Potts model of magnetic 
spins. Remember that in the Potts model, pixels were either "spin up" ($s = 0$) 
or "spin down" ($s = 1$) - similar to a grid with only background (cell ID = 0) 
and a single cell (cell ID = 1).

In the original Potts model, adhesion energy was then given by a constant
energy $J$ summed up for every neighboring pixel pair $(i,j)$ with opposite spin
($s_i \neq s_j$) [(1)](#graner-glazier):

INSERTFROMFILE 0005

For their "cellular" Potts model of the differential adhesion hypothesis,
Graner and Glazier could not use this equation. After all, they wanted to model
a system with many cells (=cellIDs) instead of just one. In addition, these 
cells had to belong to two different *kinds* of cells - with a differential 
adhesion that depended on the kinds of cells interacting. In other words, they 
still needed to sum up a surface energy $J$ for all interactions between 
neighboring pixels $(i,j)$ with ID$_i$ $\neq$ ID$_j$, but the $amount$ of 
energy $J$ should now also depend on the cell kinds $(k_i, k_j)$ of the 
interacting cells (rather than being a constant number as before).

This yielded the following equation (Figure 4) [(1)](#graner-glazier):

INSERTFROMFILE 0006

Note that the background ($k=0$) is always a single cell (with $ID = 0$). This
means that $J_{0,0}$ is never used, since we only sum up $J$ for neighboring
pixels with a *different* cell ID. If we then also have only one cell on the 
grid (only one non-zero cell ID), this means we also don't use $J_{1,1}$.
We end up with a single $J_{0,1} = J_{1,0} = J$ - the original Potts model 
equation (this is what we did to get the Ising model simulation at the top of
this page).

### Volume

A Hamiltonian with an adhesion term alone was not enough to obtain the 
Graner-Glazier model of cell sorting. Note that the system moves towards lower
energies by accepting copy attempts with negative &Delta;$H$. Since the 
adhesion term only puts an energy penalty on interactions between *different*
cells, there is a pretty simple solution to get a low energy: just remove
everything from the grid until every pixel has the same cell ID (for example,
the background ID = 0 - in fact, if you watch the simulation at the top of this
page for a while, this is probably what you will see). 

To avoid this, Graner and Glazier added an additional term to their cellular
Potts model that constrained the cell's size, or *volume* (where "volume" is
just the number of pixels on the grid belonging to that cell). They used the
following equation [(1)](#graner-glazier):

$$H_\text{volume} = \sum_{\text{cell IDs } n} \lambda_{\text{volume}, k_n}
    (V_n - V_{\text{target}, k_n})^2$$

This equation essentially renders the cells elastic by giving each cell an 
energetic penalty if it deviates from some target volume - with the size of
that penalty increasing quadratically with the deviation size (Figure 5).

INSERTFROMFILE 0007

The volume term in combination with the adhesion term is sufficient to
reproduce cell sorting, as Graner and Glazier showed:

INSERTFROMFILE  0002

### Perimeter

A frequently used variation of the [volume constraint](#volume) is the 
perimeter constraint, which works in the same way but now makes the cell 
boundary elastic (rather than its area, Figure 6). The equation is analogous 
to the volume term:

$$H_\text{perimeter} = \sum_{\text{cell IDs } n} \lambda_{\text{perimeter}, k_n}
    (P_n - P_{\text{target}, k_n})^2$$

INSERTFROMFILE 0008

Note that just like the [adhesion term](#adhesion), we count the number of
contacts with neighbor pixels belonging to different cells (different cell ID).
However, whereas the adhesion scales linearly with the number of such contacts
(awarding some constant energy $J$ per contact), we now look at the *deviation*
from a target number of contacts (perimeter) - and this appears in the
Hamiltonian as a squared (rather than linear) term. By combining an adhesion 
term with a perimeter term (and a volume term), we get a cell with a "ruffling 
membrane" that still sticks together:

INSERTFROMFILE 0009

Unlike with the adhesion term, removing all cells
from the grid is no longer a simple solution to decrease the global energy.
While the solution with no cells may still have the lowest energy (the term
sums over cells, so without cells there is no penalty), the system has no way
to achieve that state: to remove all pixels belonging to a cell, that cell first
has to *decrease* its perimeter $P \rightarrow 0$. Any copy attempt that tries
to remove a pixel from a cell with a perimeter that is already too small will 
have a very large positive $\Delta H_\text{perimeter}$, and is therefore 
unlikely to succeed.

### Cell migration

While the cells we have seen so far have dynamic membranes and float around
to some extent, we cannot yet speak of active motion. Yet many studies have
used CPMs to investigate cell migration. Many extensions to the Hamiltonian 
have been developed to simulate different types of cell motion in the CPM,
and we will discuss some options here. 

#### Cell-extrinsic forces

The easiest way to make cells move is by letting them respond to some external
attracting force, favouring copy attempts in a given direction. This is 
typically done by comparing the direction of the copy attempt (the vector 
pointing from the *source* pixel that tries to copy itself, to the *target*
neighbor it tries to copy into) to some preferred reference direction. If these
two vectors are aligned, we assign it a negative $&Delta;H$ to make this copy
attempt more favourable. If the copy attempt would go in the opposite direction,
it gets a positive $&Delta;H$ and a lower success chance.

A simple implementation attracts cells to some point in space through some 
unknown mechanism. We use the following Hamiltonian:

$$\Delta H_\text{attractionpoint} = -\lambda_\text{attractionpoint} \cos \alpha$$

where $\alpha$ is the angle between $v_\text{copy}$, the vector from the source
to the target pixel, and $v_\text{attraction}$, the vector from the source 
pixel to the attracting point. Since $\cos \alpha$ is 1 when the copy attempt
points towards the attractionpoint and -1 when it points in the opposite
direction, this term favours copy attempts in the direction of the attracting
point. The $\lambda$ scaling factor determines the strength of the force.

Similarly, cells may feel an attraction *field* rather than attraction to a 
specific point. In this case, cells are always attracted in the same direction,
regardless of their current location in space. We get the following 
Hamiltonian equation:

$$\Delta H_\text{direction} = -\lambda_\text{direction} \vec v_\text{copy} 
    \dot \vec{v}_\text{field}$$
    
where

$$\vec v_\text{copy} \dot \vec{v}_\text{field} = $$


AttractionPointConstraint, PreferredDirectionConstraint, ChemotaxisConstraint

#### Cell-intrinsic mechanisms of motion


ActivityConstraint, PersistenceConstraint



## References


[1] <a id="graner-glazier"></a> Graner & Glazier (1992). 
    <a href="https://www.if.ufrgs.br/~leon/cursopg/mod_min/Articles/PRL_69-13-2013.pdf">
        Simulation of biological cell sorting using a two-dimensional extended Potts model. 
    </a>
    
[2] <a id="basic-potts"></a> Wikipedia. 
    <a href="https://en.wikipedia.org/wiki/Potts_model">
        The Potts model.
    </a>
    
[3] <a id="cpm-history"></a> Glazier, Balter, Poplawski (2007).
    <a href="https://link.springer.com/chapter/10.1007/978-3-7643-8123-3_4">
        Magnetization to Morphogenesis: a brief history of the 
        Glazier-Graner-Hogeweg model.
    </a>