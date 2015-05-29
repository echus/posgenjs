from flask import Flask, request, jsonify
from flask.ext.cors import CORS

from lxml import etree
import subprocess
import sys
import os
import numpy as np

WORKFILEIN = "/var/www/echus.co/public_html/posgenjs/posgen/temp/run.xml"
WORKFILEOUT = "/var/www/echus.co/public_html/posgenjs/posgen/temp/run.out"
POSGEN =  "/var/www/echus.co/public_html/posgenjs/posgen/posgen"
DOCTYPE = '<!DOCTYPE posscript SYSTEM "posscript.dtd">'

app = Flask(__name__)
cors = CORS(app)

app.debug = True

@app.route("/points", methods=['POST'])
def points():
    query = request.get_json(force=True)
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
        pass

    # Write posgen point output to file
    with open(WORKFILEOUT, 'w') as f:
        subprocess.call([POSGEN, "-text", WORKFILEIN], stdout=f)

    # Parse resulting text points
    points = np.loadtxt(WORKFILEOUT)
    print >> sys.stderr, "Points loaded with np.loadtxt(): ", points

    # Serialize
    responsedict = {k:list(points[:,i]) for k, i in zip(["x","y","z","mass"], range(4))}
    print >> sys.stderr, "Response dict: ", responsedict
    response = jsonify(**responsedict)

    # Clean up workfiles
    os.remove(WORKFILEIN)
    os.remove(WORKFILEOUT)

    return response
