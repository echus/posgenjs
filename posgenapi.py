from flask import Flask, request, jsonify, url_for
from flask.ext.cors import CORS

from lxml import etree
import subprocess
import sys
import os
import numpy as np
from collections import defaultdict

WORKFILEIN = "/var/www/echus.co/public_html/posgenjs/posgen/temp/run.xml"
WORKFILEOUT = "/var/www/echus.co/public_html/posgenjs/posgen/temp/run.out"

POSFILE = "/var/www/echus.co/public_html/posgenjs/static/points.pos"
POSURL = "static/points.pos"

POSGEN =  "/var/www/echus.co/public_html/posgenjs/posgen/posgen"

DOCTYPE = '<!DOCTYPE posscript SYSTEM "posscript.dtd">'

app = Flask(__name__)
cors = CORS(app)

app.debug = True

@app.route("/points", methods=['POST'])
def points():
    query = request.get_json(force=True)

    points = posgen(query)
    print >> sys.stderr, "Response dict: ", points

    response = jsonify(**points)

    return response

@app.route("/points/pos", methods=['POST'])
def pointspos():
    query = request.get_json(force=True)

    url = posgen(query, pos=True)
    print >> sys.stderr, "Response dict (pos): ", url

    response = jsonify(**url)

    return response

def posgen(query, pos=False):
    lattice = query['lattice']
    x = query['bounds']['x']
    y = query['bounds']['y']
    z = query['bounds']['z']
    spacing = query['spacing']
    mass = {str(k): float(v) for k, v in query['mass'].items()}

    # Generate XML for posgen for this input
    root = etree.Element("posscript")
    version = etree.Element("version")
    version.attrib["value"] = "0.0.1"

    setup = etree.Element(lattice)
    bound = etree.Element("bound")
    bound.attrib["x"] = x
    bound.attrib["y"] = y
    bound.attrib["z"] = z
    setup.append(bound)
    s = etree.Element("spacing")
    A = etree.Element("A")
    A.attrib["value"] = spacing
    s.append(A)
    setup.append(s)
    for i, m in mass.items():
        atom = etree.Element("atom")
        atom.attrib["index"] = "("+str(i)+")"
        atom.attrib["mass"] = str(m)
        setup.append(atom)

    root.append(version)
    root.append(setup)

    # Write to workfile
    xmlstring = etree.tostring(root, pretty_print=True, doctype=DOCTYPE)

    with open(WORKFILEIN, 'w') as f:
        f.write(xmlstring)

    # Run posgen with XML as input (remember dtd needs to be in same directory)

    # Debug/error checking
    try:
        out = subprocess.check_output([POSGEN, "-text", WORKFILEIN], stderr=subprocess.STDOUT)
        print >> sys.stderr, "Success! Output follows."
        print >> sys.stderr, out
    except subprocess.CalledProcessError as inst:
        print >> sys.stderr, "Exception!"
        print >> sys.stderr, inst.output
        # TODO Handle error in API function, return appropriate status code
        return None

    if not pos:
        # Output as text, return points dict
        # Write posgen point output to file
        with open(WORKFILEOUT, 'w') as f:
            subprocess.call([POSGEN, "-text", WORKFILEIN], stdout=f)

        # Parse resulting text points
        points = np.loadtxt(WORKFILEOUT)
        print >> sys.stderr, "Points loaded with np.loadtxt(): ", points

        # Serialize
        # Return json organising points by mass
        responsedict = defaultdict(list)
        for pt in points:
            responsedict[str(pt[3])].append(list(pt[:3]))

        # Clean up workfiles
        os.remove(WORKFILEIN)
        os.remove(WORKFILEOUT)
    else:
        # Output as pos, return link to posfile
        with open(POSFILE, 'w') as f:
            subprocess.call([POSGEN, "-pos", WORKFILEIN], stdout=f)

        # Return link to posfile
        responsedict = { "url":POSURL }

    return responsedict
